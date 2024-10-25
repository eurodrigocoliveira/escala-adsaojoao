// server.js - Configuração inicial
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Conexão com o MongoDB
mongoose.connect('mongodb://localhost:27017/escalas_voluntarios', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Modelos do MongoDB
const Voluntario = mongoose.model('Voluntario', new mongoose.Schema({
  nome: String,
  email: String,
  senha: String,
  role: { type: String, default: 'voluntario' },  // ou "admin"
}));

const Escala = mongoose.model('Escala', new mongoose.Schema({
  voluntario_id: mongoose.Schema.Types.ObjectId,
  mes: String,
  ano: Number,
  dias: [{ dia: Number, status: String }],
}));

// Registro de voluntário
app.post('/voluntarios', async (req, res) => {
  const { nome, email, senha, role } = req.body;
  const hashedSenha = await bcrypt.hash(senha, 10);
  const novoVoluntario = new Voluntario({ nome, email, senha: hashedSenha, role });
  await novoVoluntario.save();
  res.status(201).send('Voluntário registrado com sucesso');
});

// Login de voluntário
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  const voluntario = await Voluntario.findOne({ email });
  if (!voluntario) return res.status(404).send('Usuário não encontrado');
  
  const isSenhaValida = await bcrypt.compare(senha, voluntario.senha);
  if (!isSenhaValida) return res.status(401).send('Senha incorreta');
  
  const token = jwt.sign({ _id: voluntario._id, role: voluntario.role }, 'chave_secreta');
  res.send({ token });
});

// Adicionar escala
app.post('/escala', async (req, res) => {
  const { voluntario_id, mes, ano, dias } = req.body;
  const novaEscala = new Escala({ voluntario_id, mes, ano, dias });
  await novaEscala.save();
  res.status(201).send('Escala criada com sucesso');
});

// Visualizar escalas por voluntário
app.get('/escala/:voluntario_id', async (req, res) => {
  const { voluntario_id } = req.params;
  const escalas = await Escala.find({ voluntario_id });
  res.send(escalas);
});

// Iniciar o servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
