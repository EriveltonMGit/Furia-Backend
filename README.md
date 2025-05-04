# Projeto Fúria - Backend

## Visão Geral

Este é o backend da plataforma Furia Fan. Ele é construído utilizando **Node.js** com o framework **Express.js** para fornecer uma API robusta e escalável para o frontend da aplicação. O backend é responsável por [Breve descrição das responsabilidades do backend, por exemplo: autenticação de usuários, gerenciamento de dados, comunicação com o banco de dados, etc.]. Os dados da aplicação são persistidos no **Firebase**.

## URL de Acesso

-   **Backend:** [https://furia-backend-8tck.onrender.com/](https://furia-backend-8tck.onrender.com/)

## Repositório

O código fonte deste backend pode ser encontrado aqui: [https://github.com/EriveltonMGit/Furia-Backend](https://github.com/EriveltonMGit/Furia-Backend)

## Tecnologias Utilizadas

-   **Node.js:** Ambiente de execução JavaScript para o servidor.
-   **Express.js:** Framework web minimalista e flexível para Node.js.
-   **Firebase:** SDK para interação com o banco de dados e outros serviços do Firebase.
-   **firebase-admin:** SDK para realizar operações administrativas no Firebase a partir do servidor.
-   **jsonwebtoken:** Biblioteca para geração e verificação de tokens JWT para autenticação.
-   **bcryptjs:** Biblioteca para hash de senhas.
-   **body-parser:** Middleware para analisar corpos de requisição HTTP.
-   **cors:** Middleware para habilitar Cross-Origin Resource Sharing.
-   **morgan:** Middleware para logging de requisições HTTP.
-   **multer:** Middleware para lidar com o upload de arquivos.
-   **@google-cloud/aiplatform:** SDK do Google Cloud para interagir com a plataforma de IA.
-   **@google/generative-ai:** Biblioteca para utilizar modelos de inteligência artificial generativa do Google.
-   **Outras:** `axios`, `cookie-parser`, `dotenv`, `uuid`.

## Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas em sua máquina:

-   **Node.js** (versão recomendada: >= 18) e **npm** ou **yarn**.
-   **Git** para clonar o repositório.
-   Conexão com a internet para acessar as dependências e os serviços online.

## Instruções de Instalação e Execução

1.  Clone o repositório do backend:
    ```bash
    git clone https://github.com/EriveltonMGit/Furia-Backend
    cd Furia-Backend
    ```
2.  Instale as dependências:
    ```bash
    npm install  # Ou yarn install
    ```
3.  Configure as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto e adicione as configurações necessárias, como as credenciais do Firebase (chave privada da conta de serviço), segredo para JWT, etc. Exemplo:
    ```
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    FIREBASE_CLIENT_EMAIL=seu_email@seuprojeto.iam.gserviceaccount.com
    FIREBASE_PROJECT_ID=seu-projeto-id
    JWT_SECRET=sua_chave_secreta_jwt
    # Outras variáveis de ambiente conforme necessário
    ```
    **Importante:** Nunca commite arquivos `.env` com informações sensíveis para repositórios públicos.
4.  Execute o backend em modo de desenvolvimento:
    ```bash
    npm run dev  # Este script geralmente utiliza o nodemon para reiniciar o servidor em caso de alterações no código.
    ```
    Isso iniciará o servidor backend, geralmente acessível em um endereço local (a porta padrão pode variar dependendo da configuração, mas frequentemente é `http://localhost:8000` ou similar). Verifique os logs do servidor para confirmar o endereço e a porta.

5.  Para executar o backend em modo de produção:
    ```bash
    npm start
    ```
    Este script geralmente inicia o servidor utilizando o `node server.js`.

## Documentação da API

A documentação da API do backend pode estar disponível em diferentes formatos. Verifique os seguintes locais:

-   Um arquivo `README.md` ou `API.md` dentro deste repositório.
-   Uma pasta `docs` contendo a documentação da API (por exemplo, em formato Markdown ou Swagger/OpenAPI).
-   Um endpoint específico da API para documentação (por exemplo, `/api-docs` ou `/swagger`). Acesse a URL base do backend (`https://furia-backend-8tck.onrender.com/`) e verifique se há algum link ou rota indicativa para a documentação.

A documentação da API deve fornecer detalhes sobre os endpoints disponíveis, métodos HTTP, parâmetros de requisição, corpos de requisição (request bodies) e formatos de resposta (response bodies).

## Banco de Dados (Firebase)

Este backend utiliza o Firebase como banco de dados. A interação com o Firebase é configurada utilizando o SDK do Firebase Admin. Certifique-se de que as credenciais da sua conta de serviço do Firebase estejam corretamente configuradas nas variáveis de ambiente para permitir que o backend leia e escreva dados no banco de dados.

As regras de segurança do seu banco de dados Firebase devem ser configuradas no console do Firebase para proteger os dados da sua aplicação.

## Contribuição

Se você deseja contribuir para o backend do Projeto Fúria, siga estas etapas:

1.  Faça um fork do repositório.
2.  Crie uma branch para sua feature ou correção de bug: `git checkout -b feature/nova-funcionalidade` ou `git checkout -b fix/bug-xyz`.
3.  Faça suas alterações e commit: `git commit -m "Adiciona nova funcionalidade"` ou `git commit -m "Corrige bug xyz"`.
4.  Faça push para a sua branch: `git push origin feature/nova-funcionalidade`.
5.  Abra um Pull Request para o repositório principal.

## Considerações Finais

Este README fornece informações essenciais para configurar, executar e entender o backend do Projeto Fúria. Consulte a documentação da API para detalhes sobre como interagir com os endpoints fornecidos por este servidor. Para informações sobre o frontend da aplicação, consulte o README do repositório do frontend.
