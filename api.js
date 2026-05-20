async function apiGet() {
  try {
    setSyncStatus("syncing");

    const response = await fetch(CFG.url + "?token=" + CFG.token);

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro ao buscar dados");
    }

    setSyncStatus("ok");

    return result.data;
  } catch (err) {
    setSyncStatus("error");

    console.error(err);

    toast(err.message, "red");

    throw err;
  }
}

async function apiPost(payload) {
  try {
    setSyncStatus("syncing");

    const response = await fetch(CFG.url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        ...payload,
        token: CFG.token,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Erro na API");
    }

    setSyncStatus("ok");

    return result.data;
  } catch (err) {
    setSyncStatus("error");

    console.error(err);

    toast(err.message, "red");

    throw err;
  }
}
