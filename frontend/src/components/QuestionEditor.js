import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Code as CodeIcon,
  Quiz as QuizIcon,
  Article as EssayIcon,
  CheckBox as TrueFalseIcon
} from '@mui/icons-material';

const QuestionEditor = ({ questions = [], onQuestionsChange }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionData, setQuestionData] = useState({
    type: 'multiple_choice',
    question: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' }
    ],
    correct_answer: '',
    score: 10
  });

  const questionTypes = {
    multiple_choice: { 
      label: 'ปรนัย (Multiple Choice)', 
      icon: <QuizIcon />,
      color: 'primary'
    },
    code: { 
      label: 'เขียนโปรแกรม (Code)', 
      icon: <CodeIcon />,
      color: 'secondary' 
    },
    essay: { 
      label: 'อัตนัย (Essay)', 
      icon: <EssayIcon />,
      color: 'success' 
    },
    true_false: { 
      label: 'ถูก/ผิด (True/False)', 
      icon: <TrueFalseIcon />,
      color: 'warning' 
    }
  };

  const openCreateDialog = () => {
    setEditingQuestion(null);
    setQuestionData({
      type: 'multiple_choice',
      question: '',
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' }
      ],
      correct_answer: '',
      score: 10
    });
    setOpenDialog(true);
  };

  const openEditDialog = (question) => {
    setEditingQuestion(question);
    setQuestionData(question);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingQuestion(null);
  };

  const handleSave = () => {
    const newQuestions = [...questions];
    
    if (editingQuestion) {
      // Update existing question
      const index = newQuestions.findIndex(q => q.id === editingQuestion.id);
      if (index !== -1) {
        newQuestions[index] = { ...questionData, id: editingQuestion.id };
      }
    } else {
      // Add new question
      const newId = Math.max(0, ...newQuestions.map(q => q.id || 0)) + 1;
      newQuestions.push({ ...questionData, id: newId });
    }
    
    onQuestionsChange(newQuestions);
    handleClose();
  };

  const handleDelete = (questionId) => {
    const newQuestions = questions.filter(q => q.id !== questionId);
    onQuestionsChange(newQuestions);
  };

  const handleInputChange = (field, value) => {
    setQuestionData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (optionId, text) => {
    setQuestionData(prev => ({
      ...prev,
      options: prev.options.map(opt => 
        opt.id === optionId ? { ...opt, text } : opt
      )
    }));
  };

  const addOption = () => {
    const nextId = String.fromCharCode(97 + questionData.options.length); // a, b, c, d, e, ...
    setQuestionData(prev => ({
      ...prev,
      options: [...prev.options, { id: nextId, text: '' }]
    }));
  };

  const removeOption = (optionId) => {
    if (questionData.options.length > 2) {
      setQuestionData(prev => ({
        ...prev,
        options: prev.options.filter(opt => opt.id !== optionId)
      }));
    }
  };

  const renderQuestionForm = () => {
    switch (questionData.type) {
      case 'multiple_choice':
        return (
          <>
            <TextField
              fullWidth
              label="คำถาม"
              value={questionData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>ตัวเลือก:</Typography>
            {questionData.options.map((option, index) => (
              <Box key={option.id} display="flex" alignItems="center" mb={1}>
                <Typography sx={{ mr: 1, minWidth: 20 }}>{option.id.toUpperCase()}.</Typography>
                <TextField
                  fullWidth
                  value={option.text}
                  onChange={(e) => handleOptionChange(option.id, e.target.value)}
                  placeholder={`ตัวเลือก ${option.id.toUpperCase()}`}
                  size="small"
                />
                {questionData.options.length > 2 && (
                  <IconButton onClick={() => removeOption(option.id)} size="small">
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            
            <Button startIcon={<AddIcon />} onClick={addOption} size="small">
              เพิ่มตัวเลือก
            </Button>
            
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>คำตอบที่ถูกต้อง:</Typography>
            <RadioGroup
              value={questionData.correct_answer}
              onChange={(e) => handleInputChange('correct_answer', e.target.value)}
            >
              {questionData.options.map((option) => (
                <FormControlLabel 
                  key={option.id}
                  value={option.id} 
                  control={<Radio />} 
                  label={`${option.id.toUpperCase()}. ${option.text || 'ตัวเลือก ' + option.id.toUpperCase()}`} 
                />
              ))}
            </RadioGroup>
          </>
        );

      case 'code':
        return (
          <>
            <TextField
              fullWidth
              label="คำถาม (โจทย์เขียนโปรแกรม)"
              value={questionData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="ผลลัพธ์ที่คาดหวัง"
              value={questionData.expected_output || ''}
              onChange={(e) => handleInputChange('expected_output', e.target.value)}
              margin="normal"
            />
          </>
        );

      case 'essay':
        return (
          <>
            <TextField
              fullWidth
              label="คำถาม"
              value={questionData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              margin="normal"
              multiline
              rows={4}
            />
            <TextField
              fullWidth
              label="จำนวนคำสูงสุด"
              type="number"
              value={questionData.max_words || 200}
              onChange={(e) => handleInputChange('max_words', parseInt(e.target.value))}
              margin="normal"
            />
          </>
        );

      case 'true_false':
        return (
          <>
            <TextField
              fullWidth
              label="คำถาม"
              value={questionData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>คำตอบที่ถูกต้อง:</Typography>
            <RadioGroup
              value={questionData.correct_answer}
              onChange={(e) => handleInputChange('correct_answer', e.target.value === 'true')}
            >
              <FormControlLabel value="true" control={<Radio />} label="ถูก (True)" />
              <FormControlLabel value="false" control={<Radio />} label="ผิด (False)" />
            </RadioGroup>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">จัดการคำถาม</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          เพิ่มคำถาม
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {questions.length === 0 ? (
          <Typography color="textSecondary" align="center" py={4}>
            ยังไม่มีคำถาม กดปุ่ม "เพิ่มคำถาม" เพื่อเริ่มสร้างข้อสอบ
          </Typography>
        ) : (
          <List>
            {questions.map((question, index) => {
              const typeInfo = questionTypes[question.type] || questionTypes.multiple_choice;
              return (
                <React.Fragment key={question.id}>
                  <ListItem>
                    <DragIcon sx={{ mr: 1, color: 'action.disabled' }} />
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h6">
                            ข้อ {index + 1}. {question.question}
                          </Typography>
                          <Chip 
                            icon={typeInfo.icon}
                            label={typeInfo.label} 
                            color={typeInfo.color} 
                            size="small" 
                          />
                          <Chip 
                            label={`${question.score} คะแนน`} 
                            variant="outlined" 
                            size="small" 
                          />
                        </Box>
                      }
                      secondary={
                        question.type === 'multiple_choice' && question.options ? (
                          <Box mt={1}>
                            {question.options.map((option) => (
                              <Typography 
                                key={option.id} 
                                variant="body2" 
                                sx={{ 
                                  color: option.id === question.correct_answer ? 'success.main' : 'text.secondary',
                                  fontWeight: option.id === question.correct_answer ? 'bold' : 'normal'
                                }}
                              >
                                {option.id.toUpperCase()}. {option.text}
                                {option.id === question.correct_answer && ' ✓'}
                              </Typography>
                            ))}
                          </Box>
                        ) : question.type === 'code' ? (
                          <Typography variant="body2" color="textSecondary">
                            คำถามเขียนโปรแกรม - ผลลัพธ์ที่คาดหวัง: {question.expected_output}
                          </Typography>
                        ) : question.type === 'essay' ? (
                          <Typography variant="body2" color="textSecondary">
                            คำถามอัตนัย - จำนวนคำสูงสุด: {question.max_words || 200} คำ
                          </Typography>
                        ) : question.type === 'true_false' ? (
                          <Typography variant="body2" color="textSecondary">
                            คำตอบที่ถูกต้อง: {question.correct_answer ? 'ถูก' : 'ผิด'}
                          </Typography>
                        ) : null
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => openEditDialog(question)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(question.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < questions.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Create/Edit Question Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuestion ? 'แก้ไขคำถาม' : 'สร้างคำถามใหม่'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>ประเภทคำถาม</InputLabel>
                <Select
                  value={questionData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="ประเภทคำถาม"
                >
                  {Object.entries(questionTypes).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      {type.icon} {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="คะแนน"
                type="number"
                value={questionData.score}
                onChange={(e) => handleInputChange('score', parseInt(e.target.value))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              {renderQuestionForm()}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained">
            {editingQuestion ? 'อัพเดท' : 'เพิ่ม'}คำถาม
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionEditor;
