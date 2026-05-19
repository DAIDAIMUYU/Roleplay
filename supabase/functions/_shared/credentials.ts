import type { SupabaseClient, User } from "jsr:@supabase/supabase-js@2";
import type { ProviderCredentialRecord, ProviderSecretRecord } from "./provider.ts";

export async function getCredentialForUser(
  serviceClient: SupabaseClient,
  user: Pick<User, "id">,
  credentialId: string,
): Promise<{ credential: ProviderCredentialRecord; secret: ProviderSecretRecord }> {
  const { data: credential, error: credentialError } = await serviceClient
    .from("provider_credentials")
    .select("*")
    .eq("id", credentialId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .neq("status", "deleted")
    .maybeSingle();

  if (credentialError || !credential) {
    throw new Error("未找到可用的托管凭据。");
  }

  const { data: secret, error: secretError } = await serviceClient
    .from("provider_credential_secrets")
    .select("*")
    .eq("credential_id", credentialId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (secretError || !secret) {
    throw new Error("托管凭据密文不存在或已被删除。");
  }

  return {
    credential: credential as ProviderCredentialRecord,
    secret: secret as ProviderSecretRecord,
  };
}

export async function clearDefaultCredential(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await serviceClient
    .from("provider_credentials")
    .update({
      is_default: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .neq("status", "deleted")
    .eq("is_default", true);

  if (error) throw error;
}

export async function chooseFallbackDefaultCredential(
  serviceClient: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await serviceClient
    .from("provider_credentials")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) return;

  const { error: updateError } = await serviceClient
    .from("provider_credentials")
    .update({
      is_default: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .eq("user_id", userId);

  if (updateError) throw updateError;
}
