# AuthNSecurity

Tutorial on Authentication and Security

Level 1:
Store username and password as plain text in database
Retrieved from database as plain text

Level 2:
Store username as plain text
Store password as encrypted data
Use mongoose-encryption to encrypt password with a secret passphrase (Encrypt with AES-256-CBC)
Secret passphrase is added to the collections schema with a plugin
Encryption and Decryption occurs automatically during mongoose store (save) and retrieve (find) functions
