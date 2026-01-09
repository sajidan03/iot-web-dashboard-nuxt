export default defineEventHandler(async() => {
    const ANTARES_URL = "https://platform.antares.id:8443/~/antares-cse/antares-id/smart-home-sajidan/home-monitor/ol"
    const response = await fetch(ANTARES_URL, {
        method: "GET",
        headers: {
              "X-M2M-Origin": "6d2037ca7598fc08:53aa9b2181782f19",
            "Accept": "application/json"
        }
    });
    if (!response.ok) {
        return{
            error: true,
            status: response.status
        }
    }
    const data = await response.json();
    return data
})