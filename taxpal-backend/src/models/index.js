const User = require('./User');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const Category = require('./Category');
const Alert = require('./Alert');

// Associations
User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId', onDelete: 'CASCADE' });
Budget.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Category, { foreignKey: 'userId', onDelete: 'CASCADE' });
Category.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Alert, { foreignKey: 'userId', onDelete: 'CASCADE' });
Alert.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Transaction,
  Budget,
  Category,
  Alert
};
