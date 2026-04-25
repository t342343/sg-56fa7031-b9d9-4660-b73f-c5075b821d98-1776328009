-- Create support_requests table (completely isolated from core system)
CREATE TABLE IF NOT EXISTS support_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- RLS Policies
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a support request (used from login page without auth)
CREATE POLICY "Anyone can insert support requests"
    ON support_requests FOR INSERT
    TO public
    WITH CHECK (true);

-- Only admins can view support requests
CREATE POLICY "Admins can view support requests"
    ON support_requests FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Only admins can update support requests
CREATE POLICY "Admins can update support requests"
    ON support_requests FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );