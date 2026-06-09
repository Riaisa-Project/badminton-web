const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.put('/:id/status', transactionController.updateTransactionStatus);
router.delete('/', transactionController.deleteTransactions);

module.exports = router;
