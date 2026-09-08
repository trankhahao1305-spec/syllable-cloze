import { WordItem } from '../types';

export const PROMPT_TEMPLATE = `Bạn là một nhà từ điển học tiếng Anh chuyên về Oxford Advanced Learner's Dictionary và Oxford Collocations Dictionary.

Nhiệm vụ: Phân tích danh sách từ vựng thành các thành phần ngôn ngữ chuẩn mực: âm tiết, loại từ, phiên âm IPA, định nghĩa tiếng Anh chuẩn từ điển, nghĩa tiếng Việt, 2-4 cụm từ đi chung thông dụng (Collocations), câu ví dụ và prompt tạo ảnh 2D.

Quy tắc bắt buộc:
1. Phân tách âm tiết (chunks): Theo đúng mục từ điển quốc tế (Oxford Hyphenation).
   - "perseverance" -> ["per", "se", "ver", "ance"]
   - "necessary" -> ["nec", "es", "sar", "y"]
2. definition_en: Trích xuất định nghĩa tiếng Anh súc tích, chuẩn học thuật theo Oxford Advanced Learner's Dictionary.
3. collocations: Trích xuất từ 2 đến 4 cụm kết hợp từ hay gặp nhất theo từ điển Oxford Collocations (gồm adj + noun, verb + noun, hoặc noun + verb).
4. image_prompt: Tình huống cụ thể, kết thúc bằng "clean 2d vector cartoon, flat colors, white background".

Chỉ trả về DUY NHẤT một khối JSON hợp lệ nằm trong thẻ \`\`\`json ... \`\`\`:
[
  {
    "word": "perseverance",
    "ipa": "/ˌpɜː.sɪˈvɪə.rəns/",
    "type": "DANH TỪ",
    "meaning": "sự kiên trì, bền bỉ",
    "definition_en": "the quality of continuing to try to achieve a particular aim despite difficulties",
    "collocations": [
      "great perseverance",
      "demonstrate perseverance",
      "perseverance pays off"
    ],
    "chunks": ["per", "se", "ver", "ance"],
    "image_prompt": "simple 2d cute cartoon illustration of a tiny turtle climbing a steep mountain, clean flat vector, white background",
    "example": "They showed great perseverance in the face of difficulty.",
    "example_vi": "Họ đã thể hiện sự kiên trì to lớn khi đối mặt với khó khăn."
  }
]

Danh sách từ cần xử lý:
{WORDS_INPUT}`;

export function generatePrompt(wordsInput: string): string {
  const cleanInput = wordsInput
    .split(/[\n,;]+/)
    .map(w => w.trim())
    .filter(Boolean)
    .join(', ');

  return PROMPT_TEMPLATE.replace('{WORDS_INPUT}', cleanInput || 'imperative, communication, comfortable, necessary, perseverance');
}

/**
 * Bóc tách và chuẩn hóa JSON từ phản hồi của LLM (ChatGPT, Gemini)
 */
export function parseAIResponse(rawText: string): WordItem[] {
  if (!rawText || !rawText.trim()) {
    throw new Error('Nội dung kết quả AI trống!');
  }

  // 1. Tìm trong khối markdown ```json ... ``` hoặc ``` ... ```
  const jsonBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  let target = jsonBlockMatch ? jsonBlockMatch[1].trim() : rawText.trim();

  // 2. Nếu không có khối ``` ```, tìm cặp ngoặc vuông [ ... ] bao quanh mảng JSON
  if (!target.startsWith('[') && !target.startsWith('{')) {
    const arrayMatch = target.match(/(\[[\s\S]*\])/);
    if (arrayMatch) {
      target = arrayMatch[1].trim();
    }
  }

  // 3. Xử lý dấu phẩy thừa trước dấu đóng ngoặc (trailing comma fix)
  const sanitized = target.replace(/,\s*([\]}])/g, '$1');

  let parsed: any;
  try {
    parsed = JSON.parse(sanitized);
  } catch (err: any) {
    throw new Error(`Không thể phân tích cú pháp JSON: ${err.message}. Vui lòng kiểm tra lại dữ liệu AI trả về.`);
  }

  const itemsArray = Array.isArray(parsed) ? parsed : [parsed];

  if (itemsArray.length === 0) {
    throw new Error('Dữ liệu JSON không chứa từ vựng nào!');
  }

  return itemsArray.map((item: any, idx: number): WordItem => {
    const word = String(item.word || '').trim();
    if (!word) {
      throw new Error(`Phần tử thứ ${idx + 1} thiếu trường "word"`);
    }

    let chunks: string[] = [];
    if (Array.isArray(item.chunks) && item.chunks.length > 0) {
      chunks = item.chunks.map((c: any) => String(c).trim()).filter(Boolean);
    } else {
      // Fallback: nếu AI quên chia chunks, chia tối thiểu
      chunks = [word];
    }

    const collocations = Array.isArray(item.collocations)
      ? item.collocations.map((c: any) => String(c).trim()).filter(Boolean)
      : [];

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `word_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      word,
      ipa: String(item.ipa || '').trim(),
      type: String(item.type || 'n').trim(),
      meaning: String(item.meaning || '').trim(),
      definition_en: item.definition_en ? String(item.definition_en).trim() : undefined,
      collocations: collocations.length > 0 ? collocations : undefined,
      chunks,
      example: String(item.example || '').trim(),
      example_vi: String(item.example_vi || '').trim(),
      createdAt: Date.now()
    };
  });
}
