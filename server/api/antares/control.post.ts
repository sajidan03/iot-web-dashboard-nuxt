export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const payload = {
    "m2m:cin": {
      con: JSON.stringify({
        relay1: body.relay1,
        relay2: body.relay2
      })
    }
  }

  const res = await $fetch(
    "https://platform.antares.id:8443/~/antares-cse/antares-id/smart-home-sajidan/home-control",
    {
      method: "POST",
      headers: {
        "X-M2M-Origin": "6d2037ca7598fc08:53aa9b2181782f19",
        "Content-Type": "application/json;ty=4",
        "Accept": "application/json"
      },
      body: payload
    }
  )

  return { success: true, res }
})
