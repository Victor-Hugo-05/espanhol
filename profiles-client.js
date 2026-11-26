(function () {
  "use strict";
  const client = window.supabase?.createClient(
    "https://prreywqcrxzmtmvwcuqx.supabase.co",
    "sb_publishable_KpImFoJcjf4RSNgJc1y_HA_EcRnWh_F",
    {auth:{storageKey:"language-site-auth-v1"}}
  );
  let session = null;
  let error = null;
  const ready = (async () => {
    if (!client) { error = new Error("Não foi possível carregar o serviço de contas."); return; }
    try {
      const result = await client.auth.getSession();
      if (result.error) throw result.error;
      session = result.data.session;
      client.auth.onAuthStateChange((_event, next) => { session = next; });
    } catch (e) { error = e; }
  })();
  async function load(language) {
    await ready;
    if (error) throw error;
    if (!session) return null;
    const userId = session.user.id;
    const {data, error: failure} = await client.from("vocab_progress")
      .select("unit_id,best,last_score,completed_at").eq("user_id",userId).eq("language",language);
    if (failure) throw failure;
    if (session?.user.id !== userId) throw new Error("A conta mudou. Recarregue a página.");
    return Object.fromEntries(data.map(row => [row.unit_id,{best:row.best,last:row.last_score,completedAt:Date.parse(row.completed_at)}]));
  }
  async function save(language, unitId, score, userId) {
    await ready;
    if (error) throw error;
    if (!userId || session?.user.id !== userId) throw new Error("A conta mudou. Entre novamente.");
    const {error: failure} = await client.rpc("save_vocab_progress",{p_language:language,p_unit_id:unitId,p_score:score});
    if (failure) throw failure;
  }
  window.LanguageProfiles = {client,ready,load,save,get user(){return session?.user || null;},get error(){return error;}};
})();
