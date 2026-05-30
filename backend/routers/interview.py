from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from models.schemas import TTSRequest
from services.tts_service import TTSService

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/tts")
async def text_to_speech(
    req: TTSRequest,
    tts_svc: TTSService = Depends(),
) -> StreamingResponse:
    audio_bytes = await tts_svc.synthesize(req.question_text, req.voice)
    return StreamingResponse(BytesIO(audio_bytes), media_type="audio/mpeg")
