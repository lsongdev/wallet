import { ready } from 'https://lsong.org/scripts/dom.js';
import { h, render, useState, useEffect, useRef } from 'https://lsong.org/scripts/react/index.js';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const App = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [type, setType] = useState('income');
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const dialogRef = useRef(null);

  useEffect(() => {
    loadTransactions();
    document.addEventListener('storage-imported', loadTransactions);
    return () => {
      document.removeEventListener('storage-imported', loadTransactions);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    handleSearch();
  }, [transactions]);

  const loadTransactions = () => {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  };

  const addTransaction = (newTransaction) => {
    setTransactions([...transactions, newTransaction]);
  };

  const deleteTransaction = (index) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    setTransactions(newTransactions);
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();

    const filtered = transactions.filter(t => {
      const typeMatch = filterType === 'all' || t.type === filterType;
      const keywordMatch = searchKeyword === '' || t.description.toLowerCase().includes(searchKeyword.toLowerCase());
      return typeMatch && keywordMatch;
    });

    setFilteredTransactions(filtered);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalBalance = totalIncome - totalExpense;

  const showDialog = () => {
    dialogRef.current.showModal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newTransaction = { type, date, description, amount: parseFloat(amount) };
    addTransaction(newTransaction);
    dialogRef.current.close();
    setType('income');
    setDate(getTodayDate());
    setDescription('');
    setAmount('');
  };

  const handleCancel = () => {
    dialogRef.current.close();
    setType('income');
    setDate(getTodayDate());
    setDescription('');
    setAmount('');
  };

  return [
    h('h1', null, "Wallet"),
    h('div', { className: 'card overview' }, [
      h('h3', null, "Overview"),
      h('p', {}, [
        h('label', {}, 'Total Balance:'),
        h('b', { className: 'overview-balance' }, totalBalance.toFixed(2))
      ]),
      h('div', { className: 'flex full-width' }, [
        h('p', { className: 'overview-income' }, [
          h('label', {}, 'Total Income:'),
          h('b', {}, totalIncome.toFixed(2))
        ]),
        h('p', { className: 'overview-expense' }, [
          h('label', {}, 'Total Expense: '),
          h('b', {}, totalExpense.toFixed(2))
        ]),
      ]),
      h('button', { onClick: showDialog }, "Add New Transaction"),
    ]),
    h('dialog', { ref: dialogRef, className: 'dialog dialog-drawer-bottom' }, [
      h('form', { className: 'transaction-form', onSubmit: handleSubmit }, [
        h('h2', null, "Add New Transaction"),
        h('div', null, [
          h('input', { type: 'radio', id: 'income', name: 'type', value: 'income', checked: type === 'income', onChange: e => setType(e.target.value) }),
          h('label', { htmlFor: 'income' }, "Income"),
          h('input', { type: 'radio', id: 'expense', name: 'type', value: 'expense', checked: type === 'expense', onChange: e => setType(e.target.value) }),
          h('label', { htmlFor: 'expense' }, "Expense")
        ]),
        h('label', null, 'Date'),
        h('input', { type: 'date', className: 'input', value: date, onChange: e => setDate(e.target.value), required: true }),
        h('label', null, 'Description'),
        h('input', { type: 'text', className: 'input', value: description, onChange: e => setDescription(e.target.value), required: true }),
        h('label', null, 'Amount'),
        h('input', { type: 'number', className: 'input', value: amount, inputMode: 'decimal', onChange: e => setAmount(e.target.value), required: true, step: '0.01', min: '0' }),
        h('div', { className: 'dialog-buttons' }, [
          h('button', { type: 'submit', className: 'button' }, "Submit"),
          h('button', { type: 'button', className: 'button', onClick: handleCancel }, "Cancel")
        ])
      ])
    ]),
    h('div', null, [
      h('h2', null, "Search"),
      h('form', { onSubmit: handleSearch }, [
        h('div', { className: 'flex input-group' }, [
          h('select', { className: 'input', value: filterType, onChange: e => setFilterType(e.target.value) }, [
            h('option', { value: 'all' }, "All"),
            h('option', { value: 'income' }, "Income"),
            h('option', { value: 'expense' }, "Expense"),
          ]),
          h('input', {
            type: 'search',
            className: 'flex-1 input',
            placeholder: 'Type to search ...',
            value: searchKeyword,
            onChange: e => setSearchKeyword(e.target.value)
          }),
          h('button', { type: 'submit', className: 'button' }, "Search")
        ]),
      ])
    ]),
    h('h2', null, "Transactions"),
    h('ul', { className: 'list' }, filteredTransactions.map((t, index) =>
      h('li', { key: index, className: `list-item transaction transaction-${t.type}` }, [
        h('div', { className: 'flex flex-column flex-1' }, [
          h('span', null, t.description),
          h('span', { className: 'color-999' }, t.type),
        ]),
        h('div', { className: 'flex flex-column text-right' }, [
          h('div', { className: 'transaction-amount' }, [
            h('span', { className: 'transaction-symbol' }, t.type === 'income' ? '+' : '-'),
            h('span', { className: 'transaction-value' }, t.amount.toFixed(2))
          ]),
          h('span', { className: 'transaction-date color-999' }, t.date),
        ]),
        h('button', { className: 'transaction-delete', onClick: () => deleteTransaction(index) }, "🗑️")
      ])
    )),
    h('h2', null, "Backup"),
    h('local-storage-backup'),
  ];
};

ready(() => {
  const app = document.getElementById('app');
  render(h(App), app);
});