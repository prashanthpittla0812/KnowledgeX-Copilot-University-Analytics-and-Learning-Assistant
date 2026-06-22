const axios = require('axios');
const fs = require('fs');

async function test() {
    try {
        const res = await axios.post("http://localhost:8000/api/v1/auth/login", {
            email: "faculty@gmail.com", // Assuming there is a faculty account
            password: "password123" // Or whatever the faculty password is, wait I need a token.
        });
        const token = res.data.access_token;
        const gaps = await axios.get("http://localhost:8000/api/v1/dashboard/learning-gaps", {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(JSON.stringify(gaps.data.student_performance, null, 2));
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
test();
