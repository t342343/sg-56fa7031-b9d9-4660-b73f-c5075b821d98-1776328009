import { supabase } from "@/integrations/supabase/client";

export const withdrawalService = {
  async createWithdrawalRequest(
    transactionId: string,
    userId: string,
    withdrawalAddress: string,
    amountBtc: number,
    amountEur: number
  ) {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .insert({
        transaction_id: transactionId,
        user_id: userId,
        withdrawal_address: withdrawalAddress,
        amount_btc: amountBtc,
        amount_eur: amountEur,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getWithdrawalRequests(userId?: string) {
    let query = supabase
      .from("withdrawal_requests")
      .select(`
        *,
        profiles!withdrawal_requests_user_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async updateWithdrawalStatus(requestId: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) throw error;
  }
};