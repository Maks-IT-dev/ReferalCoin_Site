document.getElementById('withdrawalForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nickname = document.getElementById('nickname').value;
    const phone = document.getElementById('phone').value;
    const amount = document.getElementById('amount').value;
    const cardNumber = document.getElementById('cardNumber').value;

    if (amount < 30) {
        alert("Мінімальна сума виводу 30!");
        return;
    }

    try {
        const response = await fetch('/transaction', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nickname, phone, amount, cardNumber }),
        });

        const data = await response.json();
        
        // Додано для перевірки статусу відповіді
        console.log('Відповідь від сервера:', data);

        if (response.ok) {
            document.getElementById('responseMessage').textContent = data.message;
            document.getElementById('responseMessage').style.display = 'block';
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Сталася помилка при обробці запиту');
        console.error('Помилка при запиті:', error);
    }
});
