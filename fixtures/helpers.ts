export function generateAutotestEmail(): string {
	const prefix = `autotest_${Math.random().toString(36).substring(2, 10)}`;
	return `${prefix}@gmail.com`;
}

export function generateRandomPhone(): string {
	const prefix = Math.floor(Math.random() * 900 + 100);
	const middle = Math.floor(Math.random() * 90 + 10);
	const last = Math.floor(Math.random() * 90 + 10);
	return `(33)${prefix}-${middle}-${last}`;
}
