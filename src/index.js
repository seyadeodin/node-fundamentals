import express from 'express';
import { v4 } from 'uuid'

const app = express();

app.use(express.json())

const customers = [];

//Middlware
//Can be passed as a parameter
function verifyIfExistAccountCPF(request, response, next){
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf)

  if(!customer) {
    return response.status(400).json({ error: 'Customer not found' })
  }
 
  request.customer = customer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit'){
      return acc + operation.amount;
    }
    return acc - operation.amount;
  }, 0)

  return balance;
}

/*
cpf: string
name: string
id: uuid
statement: []
*/

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf);

  if(customerAlreadyExists){
    return response.status(400).json({ error: 'Customer already exists' })
  }

  customers.push({
    cpf,
    name,
    id: v4(),
    statement: []
  });

  console.log(customers)

  return response.status(201).send();
})

app.get("/statement", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
})

app.post('/deposit', verifyIfExistAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  const { customer } = request

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation);

  return response.status(201).send();
})

app.post('/withdraw', verifyIfExistAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;

  const balance = getBalance(customer.statement);
  
  console.log(balance)
  if(balance < amount){
    return response.status(400).json({ error: 'Insufficient funds' })
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'withdraw'
  };

  customer.statement.push(statementOperation);

  return response.status(201).send()
})

app.get("/statement/date", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date);
  console.log(dateFormat)

  const statement = customer.statement.filter(
    statement => 
    statement.created_at.toDateString() === 
    dateFormat.toDateString()
  );

  return response.json(statement);
})

app.put("/account", verifyIfExistAccountCPF, (request, response) => {
  const  { name } = request.body;
  const { customer } = request;

  customer.name  = name;

  return response.status(201).send();
})

app.get('/account', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  
  return response.json(customer)
})

app.delete('/account', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  //splice
  customers.splice(customer, 1);

  return response.status(200).json(customers);
})

app.get('/balance', verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  const balance = getBalance(customer.statement)

  return response.json(balance);
})


app.listen(3333)
console.log('Tudo certo')
