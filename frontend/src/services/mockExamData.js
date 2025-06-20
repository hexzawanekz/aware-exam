// Mock exam data for demo purposes
export const mockExamData = {
  "demo-session-1": {
    id: "demo-session-1",
    name: "ข้อสอบ JavaScript Developer",
    duration_minutes: 60,
    questions: [
      {
        id: 1,
        type: "multiple_choice",
        text: "ข้อใดต่อไปนี้ไม่ใช่ Data Type ของ JavaScript?",
        options: [
          { id: "a", text: "String" },
          { id: "b", text: "Number" },
          { id: "c", text: "Boolean" },
          { id: "d", text: "Integer" },
        ],
        score: 10,
      },
      {
        id: 2,
        type: "multiple_choice",
        text: "คำสั่งใดใช้สำหรับประกาศตัวแปรใน JavaScript?",
        options: [
          { id: "a", text: "var" },
          { id: "b", text: "let" },
          { id: "c", text: "const" },
          { id: "d", text: "ทั้งหมดข้างต้น" },
        ],
        score: 10,
      },
      {
        id: 3,
        type: "text",
        text: "เขียนฟังก์ชัน JavaScript ที่รับพารามิเตอร์เป็นอาร์เรย์ของตัวเลข และคืนค่าผลรวมของตัวเลขทั้งหมด",
        score: 20,
      },
    ],
  },
  "demo-session-2": {
    id: "demo-session-2",
    name: "ข้อสอบ Python Developer",
    duration_minutes: 90,
    questions: [
      {
        id: 1,
        type: "multiple_choice",
        text: "ข้อใดต่อไปนี้เป็นวิธีที่ถูกต้องในการสร้าง List ใน Python?",
        options: [
          { id: "a", text: "list = []" },
          { id: "b", text: "list = list()" },
          { id: "c", text: "list = [1, 2, 3]" },
          { id: "d", text: "ทั้งหมดข้างต้น" },
        ],
        score: 10,
      },
      {
        id: 2,
        type: "multiple_choice",
        text: "คำสั่งใดใช้สำหรับติดตั้งแพ็คเกจใน Python?",
        options: [
          { id: "a", text: "pip install" },
          { id: "b", text: "python install" },
          { id: "c", text: "install" },
          { id: "d", text: "package install" },
        ],
        score: 10,
      },
      {
        id: 3,
        type: "text",
        text: "เขียนฟังก์ชัน Python ที่รับพารามิเตอร์เป็นสตริง และคืนค่าสตริงที่กลับด้าน (reverse)",
        score: 20,
      },
    ],
  },
  "demo-session-3": {
    id: "demo-session-3",
    name: "ข้อสอบ React Developer",
    duration_minutes: 75,
    questions: [
      {
        id: 1,
        type: "multiple_choice",
        text: "ข้อใดต่อไปนี้เป็น Hook ที่ใช้สำหรับจัดการ State ใน React?",
        options: [
          { id: "a", text: "useState" },
          { id: "b", text: "useEffect" },
          { id: "c", text: "useContext" },
          { id: "d", text: "useReducer" },
        ],
        score: 10,
      },
      {
        id: 2,
        type: "multiple_choice",
        text: "JSX ย่อมาจากคำว่าอะไร?",
        options: [
          { id: "a", text: "JavaScript XML" },
          { id: "b", text: "Java Syntax Extension" },
          { id: "c", text: "JavaScript Extension" },
          { id: "d", text: "JSON XML" },
        ],
        score: 10,
      },
      {
        id: 3,
        type: "text",
        text: "เขียน React Component ที่แสดงรายการสินค้า โดยรับ props เป็น array ของ object ที่มี properties: id, name, price",
        score: 20,
      },
    ],
  },
};

// Mock API response
export const getMockExamData = async (sessionId) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let examData = mockExamData[sessionId];

  // If not found in mock data, create a real session template
  if (!examData && sessionId.startsWith("real-")) {
    examData = {
      id: sessionId,
      name: "ข้อสอบจริง - Real Exam Session",
      duration_minutes: 60,
      candidate_id: 1, // Add candidate_id for real sessions
      questions: [
        {
          id: 1,
          type: "multiple_choice",
          text: "ข้อสอบนี้ใช้ระบบตรวจจับใบหน้าจริง - This exam uses real face detection",
          options: [
            { id: "a", text: "ใช่ - Yes" },
            { id: "b", text: "ไม่ใช่ - No" },
            { id: "c", text: "ไม่แน่ใจ - Not sure" },
            { id: "d", text: "ไม่ทราบ - Don't know" },
          ],
          score: 10,
        },
        {
          id: 2,
          type: "multiple_choice",
          text: "ระบบกำลังตรวจสอบใบหน้าของคุณแบบ real-time หรือไม่?",
          options: [
            { id: "a", text: "ใช่ กำลังตรวจสอบ" },
            { id: "b", text: "ไม่ใช่" },
            { id: "c", text: "ไม่แน่ใจ" },
            { id: "d", text: "ไม่เห็นกล้อง" },
          ],
          score: 10,
        },
        {
          id: 3,
          type: "text",
          text: "อธิบายความรู้สึกของคุณเมื่อใช้ระบบตรวจจับใบหน้าแบบจริง",
          score: 20,
        },
      ],
    };
  }

  if (!examData) {
    throw new Error(`Exam session ${sessionId} not found`);
  }

  return {
    data: examData,
  };
};
