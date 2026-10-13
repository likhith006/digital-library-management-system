const payload = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'Password123',
  role: 'STUDENT',
  department: 'Computer Science & Engineering',
  phone: '1234567890',
};

fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log(text);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
