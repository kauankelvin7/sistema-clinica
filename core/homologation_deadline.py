"""Prazo de homologação: 48 horas úteis corridas, sem sábado e domingo.

O formulário registra apenas a DATA do atestado, portanto a contagem começa
às 00:00 dessa data, no fuso America/Sao_Paulo. Feriados não são excluídos.
A autorização é necessária somente DEPOIS do instante exato de 48h.
"""
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

BUSINESS_TIMEZONE = ZoneInfo("America/Sao_Paulo")
MAX_HOURS = timedelta(hours=48)


def parse_certificate_date(value: str) -> date:
    """Aceita exclusivamente datas reais em formato YYYY-MM-DD."""
    try:
        parsed = date.fromisoformat(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("Data do atestado inválida; use YYYY-MM-DD.") from exc
    if parsed.isoformat() != value:
        raise ValueError("Data do atestado inválida; use YYYY-MM-DD.")
    return parsed


def homologation_deadline(certificate_date: str) -> datetime:
    """Retorna o instante em que se completam 48h fora dos fins de semana."""
    issued_on = parse_certificate_date(certificate_date)
    current = datetime.combine(issued_on, time.min, tzinfo=BUSINESS_TIMEZONE)
    remaining = MAX_HOURS

    while remaining > timedelta(0):
        next_midnight = datetime.combine(
            current.date() + timedelta(days=1), time.min, tzinfo=BUSINESS_TIMEZONE
        )
        if current.weekday() >= 5:
            current = next_midnight
            continue

        available = (
            next_midnight.astimezone(timezone.utc)
            - current.astimezone(timezone.utc)
        )
        counted = min(remaining, available)
        current = (
            current.astimezone(timezone.utc) + counted
        ).astimezone(BUSINESS_TIMEZONE)
        remaining -= counted

    return current


def needs_late_authorization(certificate_date: str, now: datetime = None) -> bool:
    """Até o prazo exato é regular; qualquer instante posterior exige autorização."""
    current = now if now is not None else datetime.now(BUSINESS_TIMEZONE)
    if current.tzinfo is None or current.utcoffset() is None:
        raise ValueError("O horário de referência deve conter fuso.")
    return current.astimezone(timezone.utc) > homologation_deadline(
        certificate_date
    ).astimezone(timezone.utc)
