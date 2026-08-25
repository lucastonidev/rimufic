import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import {webRoutes} from "../src/router/web.js";
import { ApiRoutes } from "../src/router/api.js";
import { AdminRoutes } from "../src/router/admin.js";
import { globalErrorHandler } from "../src/middleware/error.middleware.js";
import { AppError } from "../src/utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Configuração do motor EJS
app.set("views", path.join(__dirname, "../views"));

// 2. CONFIGURA O HELMET COM REGRAS DE SEGURANÇA PERSONALIZADAS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      
      // Permite scripts do seu site e do unpkg
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"], 
      
      // Permite atributos de evento em linha no HTML (como onclick e onchange)
      scriptSrcAttr: ["'unsafe-inline'"], 
      
      // Ampliamos para cobrir redirecionamentos de CDN que o Phosphor possa fazer
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com", 
        "https://unpkg.com", 
        "https://cdn.jsdelivr.net"
      ],
      
      // Adicionamos 'data:' porque algumas fontes carregam em base64 internamente
      fontSrc: [
        "'self'", 
        "https://fonts.gstatic.com", 
        "https://unpkg.com", 
        "https://cdn.jsdelivr.net",
        "data:"
      ],
      
      // Permite imagens locais, em base64 e da CDN
      imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
      
      // Permite que o Axios (ou fetch) se conecte à CDN
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  }
}));

// Middlewares essenciais
app.use(express.json()); // Entender JSON
app.use(express.urlencoded({ extended: true })); // <-- Entender formulários HTML (Login)
app.use(cookieParser()); // <-- Ler os cookies com o JWT

// Configuração da pasta public para servir CSS, JS e Assets estáticos
 app.use(express.static(path.join(__dirname, "../public")));

// Chamando as rotas da interface web
app.use("/", webRoutes);
app.use("/api/v1", ApiRoutes);
app.use("/admin", AdminRoutes);

// Middleware de rota não encontrada (404)
app.all('*', (req, res, next) => {
    // Isso joga o erro para o globalErrorHandler automaticamente!
    next(new AppError(`A rota ${req.originalUrl} não foi encontrada neste servidor.`, 404));
});

// DEVE SER O ÚLTIMO MIDDLEWARE DO ARQUIVO!
app.use(globalErrorHandler);

if (process.env.NODE_ENV !== "production") {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(
      `✨ Rimufic rodando localmente! Acesse: http://localhost:${PORT}`,
    );
  });
}

// (Futuramente colocaremos as rotas da API aqui, ex: app.use('/api', apiRoutes))

export default app;
