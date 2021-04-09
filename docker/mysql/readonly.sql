CREATE USER 'readonly'@'%' IDENTIFIED BY 'readonly';
GRANT SELECT ON nouse.* TO 'readonly'@'%';
FLUSH PRIVILEGES;