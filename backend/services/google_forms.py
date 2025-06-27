import json
import logging
from typing import Dict, List, Optional
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

class GoogleFormsService:
    SCOPES = [
        'https://www.googleapis.com/auth/forms.body.readonly',
        'https://www.googleapis.com/auth/forms.responses.readonly'
    ]
    
    def __init__(self, credentials_path: str):
        self.credentials_path = credentials_path
        self.service = None
        
    async def authenticate(self) -> bool:
        """Authentication with Google Forms API"""
        try:
            creds = None
            # Load existing credentials
            try:
                with open('token.json', 'r') as token:
                    creds = Credentials.from_authorized_user_info(json.load(token), self.SCOPES)
            except FileNotFoundError:
                pass
                
            # If there are no (valid) credentials available, let the user log in.
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                else:
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_path, self.SCOPES)
                    creds = flow.run_local_server(port=0)
                    
                # Save the credentials for the next run
                with open('token.json', 'w') as token:
                    token.write(creds.to_json())
                    
            self.service = build('forms', 'v1', credentials=creds)
            return True
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการยืนยันตัวตน Google: {str(e)}")
            return False
    
    async def get_form_structure(self, form_id: str) -> Optional[Dict]:
        """ดึงโครงสร้างของ Google Form"""
        try:
            if not self.service:
                await self.authenticate()
                
            # Get form metadata
            form = self.service.forms().get(formId=form_id).execute()
            
            questions = []
            for item in form.get('items', []):
                question = self._parse_question_item(item)
                if question:
                    questions.append(question)
                    
            return {
                'form_id': form_id,
                'title': form.get('info', {}).get('title', 'ไม่มีชื่อ'),
                'description': form.get('info', {}).get('description', ''),
                'questions': questions,
                'total_questions': len(questions)
            }
            
        except HttpError as e:
            logger.error(f"Google Forms API Error: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการดึงข้อมูล Form: {str(e)}")
            return None
    
    def _parse_question_item(self, item: Dict) -> Optional[Dict]:
        """แปลง Google Forms item เป็นรูปแบบของระบบ"""
        try:
            question_data = {
                'id': item.get('itemId'),
                'title': item.get('title', ''),
                'type': 'text',  # default
                'required': item.get('required', False),
                'options': []
            }
            
            # ตรวจสอบประเภทคำถาม
            if 'choiceQuestion' in item.get('questionItem', {}):
                choice_question = item['questionItem']['choiceQuestion']
                question_data['type'] = 'multiple_choice'
                
                # ดึงตัวเลือก
                for option in choice_question.get('options', []):
                    question_data['options'].append({
                        'id': option.get('value', ''),
                        'text': option.get('value', ''),
                        'is_correct': False  # จะต้องกำหนดทีหลัง
                    })
                    
            elif 'textQuestion' in item.get('questionItem', {}):
                text_question = item['questionItem']['textQuestion']
                if text_question.get('paragraph'):
                    question_data['type'] = 'essay'
                else:
                    question_data['type'] = 'short_text'
                    
            elif 'scaleQuestion' in item.get('questionItem', {}):
                question_data['type'] = 'scale'
                scale_question = item['questionItem']['scaleQuestion']
                question_data['scale'] = {
                    'low': scale_question.get('low', 1),
                    'high': scale_question.get('high', 5),
                    'low_label': scale_question.get('lowLabel', ''),
                    'high_label': scale_question.get('highLabel', '')
                }
                
            return question_data
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการแปลงคำถาม: {str(e)}")
            return None
    
    async def get_form_responses(self, form_id: str) -> List[Dict]:
        """ดึงคำตอบจาก Google Form (สำหรับวิเคราะห์)"""
        try:
            if not self.service:
                await self.authenticate()
                
            # Get form responses
            responses = self.service.forms().responses().list(formId=form_id).execute()
            
            parsed_responses = []
            for response in responses.get('responses', []):
                parsed_response = {
                    'response_id': response.get('responseId'),
                    'create_time': response.get('createTime'),
                    'last_submitted_time': response.get('lastSubmittedTime'),
                    'answers': {}
                }
                
                # Parse answers
                for question_id, answer in response.get('answers', {}).items():
                    parsed_response['answers'][question_id] = self._parse_answer(answer)
                    
                parsed_responses.append(parsed_response)
                
            return parsed_responses
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการดึงคำตอบ: {str(e)}")
            return []
    
    def _parse_answer(self, answer: Dict) -> Dict:
        """แปลงคำตอบจาก Google Forms"""
        parsed_answer = {
            'type': 'unknown',
            'value': None
        }
        
        try:
            if 'textAnswers' in answer:
                parsed_answer['type'] = 'text'
                text_answers = answer['textAnswers']['answers']
                if text_answers:
                    parsed_answer['value'] = text_answers[0].get('value', '')
                    
            elif 'fileUploadAnswers' in answer:
                parsed_answer['type'] = 'file'
                file_answers = answer['fileUploadAnswers']['answers']
                parsed_answer['value'] = [file.get('fileId') for file in file_answers]
                
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการแปลงคำตอบ: {str(e)}")
            
        return parsed_answer
    
    async def convert_to_exam_format(self, form_id: str, programming_language: str = None) -> Dict:
        """แปลง Google Form เป็นรูปแบบข้อสอบของระบบ"""
        try:
            form_structure = await self.get_form_structure(form_id)
            if not form_structure:
                return None
                
            exam_template = {
                'name': form_structure['title'],
                'description': form_structure['description'],
                'programming_language': programming_language or 'general',
                'google_form_id': form_id,
                'duration_minutes': 60,  # default
                'questions': []
            }
            
            # แปลงคำถาม
            for question in form_structure['questions']:
                exam_question = {
                    'id': question['id'],
                    'text': question['title'],
                    'type': question['type'],
                    'required': question['required'],
                    'points': 1,  # default
                    'options': []
                }
                
                if question['type'] == 'multiple_choice':
                    exam_question['options'] = question['options']
                elif question['type'] in ['essay', 'short_text']:
                    exam_question['max_length'] = 1000 if question['type'] == 'essay' else 100
                elif question['type'] == 'scale':
                    exam_question['scale'] = question.get('scale', {})
                    
                exam_template['questions'].append(exam_question)
                
            return exam_template
            
        except Exception as e:
            logger.error(f"เกิดข้อผิดพลาดในการแปลงรูปแบบ: {str(e)}")
            return None
    
    async def validate_form_access(self, form_id: str) -> bool:
        """ตรวจสอบว่าสามารถเข้าถึง Form ได้หรือไม่"""
        try:
            form_structure = await self.get_form_structure(form_id)
            return form_structure is not None
        except Exception:
            return False

# สร้าง singleton instance
google_forms_service = GoogleFormsService("/app/credentials/google-credentials.json") 