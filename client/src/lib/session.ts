export function getSessionId(): string {
  let sessionId = localStorage.getItem('quietprayers_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('quietprayers_session_id', sessionId);
  }
  return sessionId;
}
