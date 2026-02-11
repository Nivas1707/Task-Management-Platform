const API_URL = 'http://localhost:3000/api';
let token;

async function request(url, method = 'GET', body = null, headers = {}) {
    console.log(`Requesting ${method} ${url}`);
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    const text = await res.text();

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error(`\n!!! JSON PARSE ERROR !!!`);
        console.error(`Status: ${res.status} ${res.statusText}`);
        console.error(`Body Preview: ${text.substring(0, 500)}`);
        throw new Error(`Failed to parse JSON response from ${url}`);
    }

    if (!res.ok) {
        throw new Error(data.message || res.statusText);
    }
    return data;
}

async function login() {
    try {
        const data = await request(`${API_URL}/auth/login`, 'POST', {
            email: 'test@example.com',
            password: 'password123'
        });
        token = data.token;
        console.log('Login successful');
    } catch (error) {
        // If login fails, try registering
        try {
            await request(`${API_URL}/auth/register`, 'POST', {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
            await login();
        } catch (regError) {
            console.error('Login/Register failed', regError.message);
            process.exit(1);
        }
    }
}

async function verifyMetrics() {
    await login();
    const headers = { Authorization: `Bearer ${token}` };

    console.log('\nCreating tasks for metrics verification...');

    // 1. Create a task and complete it immediately (Fast & On-Time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const task1 = await request(`${API_URL}/tasks`, 'POST', {
        title: 'Fast Task',
        priority: 'HIGH',
        dueDate: tomorrow.toISOString()
    }, headers);

    await request(`${API_URL}/tasks/${task1.id}`, 'PATCH', { status: 'DONE' }, headers);
    console.log('Task 1 (Fast & On-Time) completed.');

    // 2. Create a task with PAST due date and complete it (Late)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const task2 = await request(`${API_URL}/tasks`, 'POST', {
        title: 'Late Task',
        priority: 'MEDIUM',
        dueDate: yesterday.toISOString()
    }, headers);

    await request(`${API_URL}/tasks/${task2.id}`, 'PATCH', { status: 'DONE' }, headers);
    console.log('Task 2 (Late) completed.');

    // Fetch Stats
    console.log('\nFetching stats...');
    const stats = await request(`${API_URL}/analytics/stats`, 'GET', null, headers);

    console.log('Stats:', JSON.stringify(stats, null, 2));

    // Validations
    let passed = true;

    // Avg Completion Time
    if (typeof stats.avgCompletionTime !== 'number' || stats.avgCompletionTime < 0) {
        console.error('FAIL: avgCompletionTime is invalid');
        passed = false;
    } else {
        console.log(`PASS: Avg Completion Time: ${stats.avgCompletionTime} ms`);
    }

    // On-Time Completion Rate
    if (typeof stats.onTimeCompletionRate !== 'number' || stats.onTimeCompletionRate < 0 || stats.onTimeCompletionRate > 100) {
        console.error('FAIL: onTimeCompletionRate is invalid');
        passed = false;
    } else {
        console.log(`PASS: On-Time Rate: ${stats.onTimeCompletionRate}%`);
    }

    if (passed) {
        console.log('✅ Performance Metrics Verification Passed');
    } else {
        console.error('❌ Verification Failed');
        process.exit(1);
    }

    // Verify Trends Structure
    console.log('\nFetching trends...');
    const trendsRes = await request(`${API_URL}/analytics/trends`, 'GET', null, headers);
    const trends = trendsRes.trends;
    console.log('Trends keys:', Object.keys(trends).slice(0, 3));
    const firstDate = Object.keys(trends)[0];
    const firstValue = trends[firstDate];

    if (typeof firstValue === 'object' && 'created' in firstValue && 'completed' in firstValue) {
        console.log('PASS: Trends structure is correct { created, completed }');
    } else {
        console.error('FAIL: Trends structure is invalid', firstValue);
        process.exit(1);
    }
    console.log('✅ Trends Verification Passed');
}

verifyMetrics();
