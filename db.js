// Database management using JSON files
class Database {
    constructor() {
        this.accountsFile = 'accounts.json';
        this.transactionsFile = 'transactions.json';
    }

    async init() {
        try {
            // Create files if not exists
            await this.createFileIfNotExists(this.accountsFile, []);
            await this.createFileIfNotExists(this.transactionsFile, []);
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }

    async createFileIfNotExists(filename, defaultContent) {
        try {
            await fetch(`check_file.php?file=${filename}`);
        } catch (error) {
            await this.writeFile(filename, defaultContent);
        }
    }

    async readFile(filename) {
        const response = await fetch(`read_file.php?file=${filename}`);
        return await response.json();
    }

    async writeFile(filename, data) {
        const response = await fetch('write_file.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filename: filename,
                data: data
            })
        });
        return await response.json();
    }

    async addAccount(account) {
        const accounts = await this.readFile(this.accountsFile);
        account.id = Date.now(); // Simple ID generation
        accounts.push(account);
        await this.writeFile(this.accountsFile, accounts);
        return account.id;
    }

    async getAccounts() {
        return await this.readFile(this.accountsFile);
    }

    async addTransaction(transaction) {
        const transactions = await this.readFile(this.transactionsFile);
        transaction.id = Date.now(); // Simple ID generation
        transactions.push(transaction);
        await this.writeFile(this.transactionsFile, transactions);
        return transaction.id;
    }

    async getTransactionsByAccount(accountId) {
        const transactions = await this.readFile(this.transactionsFile);
        return transactions.filter(t => t.accountId === accountId);
    }

    async deleteTransaction(id) {
        const transactions = await this.readFile(this.transactionsFile);
        const newTransactions = transactions.filter(t => t.id !== id);
        await this.writeFile(this.transactionsFile, newTransactions);
    }

    async updateTransaction(updatedTransaction) {
        const transactions = await this.readFile(this.transactionsFile);
        const index = transactions.findIndex(t => t.id === updatedTransaction.id);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
            await this.writeFile(this.transactionsFile, transactions);
        }
    }
}