const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password123';

bcrypt.hash(password, 10).then(hash => {
  console.log('\n✅ Password Hash Generated:');
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopy the hash above to use in Prisma Studio or seed file.\n');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

