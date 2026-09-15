const axios = require('axios');

async function fix() {
  try {
    const res = await axios.get('http://localhost:3001/api/events');
    const events = res.data;
    const chumarazhuth = events.find(e => e.name === "Chumarazhuth");
    
    if (!chumarazhuth) {
      console.log("Event not found");
      return;
    }
    
    console.log("Found event:", chumarazhuth.name, chumarazhuth._id);
    console.log("Current first place marks:", chumarazhuth.results.first.map(f => f.mark));
    console.log("Current second place marks:", chumarazhuth.results.second.map(f => f.mark));

    // Swap first and second
    const newResults = {
      first: chumarazhuth.results.second,
      second: chumarazhuth.results.first,
      third: chumarazhuth.results.third,
      others: chumarazhuth.results.others
    };

    console.log("Swapping...");

    const postRes = await axios.post('http://localhost:3001/api/events/result', {
      eventId: chumarazhuth._id,
      results: newResults
    });

    console.log("Response:", postRes.data);
    
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

fix();
