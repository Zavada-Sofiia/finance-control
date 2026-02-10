console.log("Charts loaded");

// приклад: майбутній баланс
function renderBalance(balance) {
    const el = document.getElementById("balance");
    if (el) {
        el.textContent = balance.toFixed(2);
    }
}
