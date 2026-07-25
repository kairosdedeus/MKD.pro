# YouMp3Tube para Android

Aplicativo Android local para converter links autorizados do YouTube em MP3.
Os arquivos são salvos em `Downloads/YouMp3Tube`.

## Abrir no Android Studio

1. Abra a pasta do projeto Android no Android Studio.
2. Aguarde o Gradle sincronizar.
3. Selecione um dispositivo Android 8 ou superior.
4. Execute o módulo `app`.

O aplicativo aceita links no formato:

```text
yoump3tube://convert?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D...
```

Para distribuição pelo site, gere um APK assinado em **Build → Generate Signed
Bundle / APK**. Não versione a chave privada de assinatura no repositório.
