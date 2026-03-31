-- Deaktiviere RLS für neue Tabellen (wie bei anderen Tabellen)
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;