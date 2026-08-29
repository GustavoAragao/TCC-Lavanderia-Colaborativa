import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
process.env.TZ = 'America/Sao_Paulo';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Lavanderia Colaborativa - Salobrinho')
    .setDescription('API para gestão de lavanderia, agendamentos e máquinas.')
    .setVersion('1.0')
    .addBearerAuth() // Isso permite testar rotas protegidas com o JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // A documentação estará em http://localhost:3000/api

  app.enableCors(); // Permite que apps externos acessem a API
  app.useGlobalPipes(new ValidationPipe());  // Faz o NestJS validar os dados que chegam nos DTOs 
  
  const port = process.env.PORT ?? 3000
  await app.listen(port);
  console.log(`[main] Application is running on: http://localhost:${port}`);
}
bootstrap();
