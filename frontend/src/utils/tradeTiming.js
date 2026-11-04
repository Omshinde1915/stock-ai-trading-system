// ============================================
// Trade Timing Calculator - Indian Market (IST)
// Determines best BUY time, holding period, SELL time
// ============================================

const BUY_WINDOW = {
    start: '9:30 AM',
    end: '10:30 AM',
    label: 'Morning Momentum',
};

const SELL_WINDOW = {
    start: '2:30 PM',
    end: '3:15 PM',
    label: 'Closing Strength',
};

export function getTradeTiming(
    signal,
    confidence = 70,
    riskLevel = 'MEDIUM',
    expectedReturn = 5
) {
    // -------- Holding days logic --------
    let holdingDays = 5;

    if (confidence >= 80) holdingDays = 3;
    else if (confidence >= 70) holdingDays = 5;
    else if (confidence >= 60) holdingDays = 7;
    else holdingDays = 10;

    if (expectedReturn > 10) holdingDays += 3;
    else if (expectedReturn > 5) holdingDays += 1;

    if (riskLevel === 'HIGH') holdingDays = Math.max(2, holdingDays - 2);
    if (riskLevel === 'LOW') holdingDays += 2;

    // -------- Entry / Exit windows --------
    let entryTime = `${BUY_WINDOW.start} – ${BUY_WINDOW.end}`;
    let exitTime = `${SELL_WINDOW.start} – ${SELL_WINDOW.end}`;

    if (signal === 'SELL') {
        entryTime = '—';
    }

    // -------- Dates --------
    const entryDate = nextTradingDay(new Date(), 0);
    const exitDate = nextTradingDay(entryDate, holdingDays);

    return {
        signal,
        entryTime,
        exitTime,
        entryDate: fmtDate(entryDate),
        exitDate: fmtDate(exitDate),
        holdingDays,
        entryLabel: BUY_WINDOW.label,
        exitLabel: SELL_WINDOW.label,
        timingConfidence: Math.min(95, confidence + 5),
        summary: buildSummary(signal, entryTime, holdingDays, exitTime),
    };
}

function buildSummary(signal, entryTime, holdingDays, exitTime) {
    if (signal === 'BUY') {
        return `Buy at ${entryTime} → hold ${holdingDays} days → sell at ${exitTime}`;
    }
    if (signal === 'SELL') {
        return `Sell today at ${exitTime} (exit existing position)`;
    }
    return `Wait today. Signal not clear.`;
}

function fmtDate(d) {
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function nextTradingDay(from, daysAhead) {
    const d = new Date(from);
    let added = 0;
    while (added < daysAhead) {
        d.setDate(d.getDate() + 1);
        const day = d.getDay();
        if (day !== 0 && day !== 6) added++; // skip Sat/Sun
    }
    return d;
}