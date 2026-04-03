-- Erstelle INSERT Policy für profiles (erlaubt Trigger + User selbst)
CREATE POLICY "allow_profile_insert" 
ON profiles 
FOR INSERT 
WITH CHECK (true);