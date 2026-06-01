from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from core.security import get_current_user
from models.db_models import User
from models.schemas import TTSRequest
from services.tts_service import TTSService

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/tts")
async def text_to_speech(
    req: TTSRequest,
    tts_svc: TTSService = Depends(),
    current_user: User = Depends(get_current_user),
) -> StreamingResponse:
    audio_bytes = await tts_svc.synthesize(req.question_text, req.voice)
    return StreamingResponse(BytesIO(audio_bytes), media_type="audio/mpeg")
