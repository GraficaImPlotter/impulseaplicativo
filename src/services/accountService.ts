import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type FinancialAccount = Tables<"financial_accounts">;
export type CreateAccountData = TablesInsert<"financial_accounts">;
export type UpdateAccountData = TablesUpdate<"financial_accounts">;

export const accountService = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("financial_accounts")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching accounts:", error);
      throw error;
    }
    return data || [];
  },

  getActive: async () => {
    const { data, error } = await supabase
      .from("financial_accounts")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching active accounts:", error);
      throw error;
    }
    return data || [];
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("financial_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching account:", error);
      throw error;
    }
    return data;
  },

  create: async (data: CreateAccountData) => {
    const { data: newAccount, error } = await supabase
      .from("financial_accounts")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating account:", error);
      throw error;
    }
    return newAccount;
  },

  update: async (id: string, data: UpdateAccountData) => {
    const { data: updatedAccount, error } = await supabase
      .from("financial_accounts")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating account:", error);
      throw error;
    }
    return updatedAccount;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from("financial_accounts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },
};
