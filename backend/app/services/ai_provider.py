import json
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AIProvider:
    """
    Unified AI Provider supporting:
    1. Google Gemini REST API (if GEMINI_API_KEY provided)
    2. OpenAI REST API (if OPENAI_API_KEY provided)
    3. Intelligent deterministic NLP fallback for 100% offline reliability.
    """

    @staticmethod
    async def generate_text(prompt: str, system_instruction: str = "", temperature: float = 0.7) -> str:
        # 1. Try Gemini if configured
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [{
                        "parts": [
                            {"text": f"{system_instruction}\n\n{prompt}" if system_instruction else prompt}
                        ]
                    }],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": 1024
                    }
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["candidates"][0]["content"]["parts"][0]["text"]
                    else:
                        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Error querying Gemini API: {e}")

        # 2. Try OpenAI if configured
        if settings.OPENAI_API_KEY:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": system_instruction or "You are an expert AI Interviewer and Evaluator for AIHire."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": temperature
                }
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
                    else:
                        logger.warning(f"OpenAI API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Error querying OpenAI API: {e}")

        # Fallback will be handled by the specialized service modules
        return ""
