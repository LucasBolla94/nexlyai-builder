import { prisma } from "@/lib/db";

type MemoryKind = "note" | "preference" | "instruction" | "fact";

type MemoryCandidate = {
  content: string;
  kind: MemoryKind;
  source: string;
  isExplicit: boolean;
};

const MAX_MEMORY_LENGTH = 500;

const EXPLICIT_SAVE_REGEX =
  /(lembrar|lembre|remember|save|salvar|guarde)\s*[:\-]\s*(.+)$/i;

const SENSITIVE_REGEX =
  /(sk-[\w-]{8,}|xai-[\w-]{8,}|whsec_[\w]+|eyJ[a-zA-Z0-9_-]{10,}|AKIA[0-9A-Z]{10,}|-----BEGIN|api[_-]?key|senha|password|secret|token|jwt)/i;

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;

const IMPORTANT_PATTERNS: Array<{
  kind: MemoryKind;
  regex: RegExp;
  extractor: (match: RegExpMatchArray) => string | null;
  isName?: boolean;
}> = [
  {
    kind: "fact",
    regex: /(meu nome(?:\s+e| é)?|me chamo|chamo-me|my name is|call me)\s+(.+)/i,
    extractor: (match) => match[2]?.trim() || null,
    isName: true,
  },
  {
    kind: "preference",
    regex:
      /(prefiro que você|prefiro que voce|minha preferência|my preference is|i prefer you to)\s+(.+)/i,
    extractor: (match) => match[2]?.trim() || null,
  },
  {
    kind: "instruction",
    regex:
      /(sempre|nunca|always|never)\s+(responda|fale|use|respond|answer)\s+(.+)/i,
    extractor: (match) => match[3]?.trim() || null,
  },
  {
    kind: "fact",
    regex:
      /(moro em|estou em|i live in|i am in|based in)\s+(.+)/i,
    extractor: (match) => match[2]?.trim() || null,
  },
  {
    kind: "preference",
    regex:
      /(minha lingua|minha linguagem|eu falo|i speak|language is)\s+(.+)/i,
    extractor: (match) => match[2]?.trim() || null,
  },
];

function isSensitive(content: string) {
  return (
    SENSITIVE_REGEX.test(content) ||
    EMAIL_REGEX.test(content) ||
    PHONE_REGEX.test(content)
  );
}

function normalizeContent(content: string) {
  return content.replace(/\s+/g, " ").trim().slice(0, MAX_MEMORY_LENGTH);
}

function isLikelyName(content: string) {
  if (content.length < 2) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(content)) return false;
  if (/^[^A-Za-zÀ-ÿ]+$/.test(content)) return false;
  return true;
}

export function extractMemoriesFromMessage(message: string) {
  const candidates: MemoryCandidate[] = [];
  const explicit = message.match(EXPLICIT_SAVE_REGEX);

  if (explicit) {
    const content = normalizeContent(explicit[2] || "");
    if (content && !isSensitive(content)) {
      candidates.push({
        content,
        kind: "instruction",
        source: message.slice(0, MAX_MEMORY_LENGTH),
        isExplicit: true,
      });
    }
  }

  for (const pattern of IMPORTANT_PATTERNS) {
    const match = message.match(pattern.regex);
    if (!match) continue;
    const extracted = normalizeContent(pattern.extractor(match) || "");
    if (!extracted || isSensitive(extracted)) continue;
    if (pattern.isName) {
      if (!isLikelyName(extracted)) continue;
    }
    candidates.push({
      content: extracted,
      kind: pattern.kind,
      source: message.slice(0, MAX_MEMORY_LENGTH),
      isExplicit: false,
    });
  }

  return candidates;
}

export async function saveUserMemory(
  userId: string,
  memory: { content: string; kind?: MemoryKind; source?: string }
) {
  const existing = await prisma.memory.findFirst({
    where: {
      userId,
      content: memory.content,
    },
  });

  if (existing) {
    return prisma.memory.update({
      where: { id: existing.id },
      data: {
        kind: memory.kind || existing.kind,
        source: memory.source || existing.source,
      },
    });
  }

  return prisma.memory.create({
    data: {
      userId,
      content: memory.content,
      kind: memory.kind || "note",
      source: memory.source || null,
    },
  });
}

export async function getUserMemories(userId: string, limit = 10) {
  return prisma.memory.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
