-- Adding new column
ALTER TABLE `positions` ADD `positions_teamPageGroup` TINYINT NOT NULL DEFAULT 4;

-- Senior Team
UPDATE `positions` SET `positions_teamPageGroup` = 1
WHERE `positions_id` IN (48,3,4,5,51,52);

-- Nouse
UPDATE `positions` SET `positions_teamPageGroup` = 2
WHERE `positions_id` IN (17,18,19,20,21,22,23,24,27,28,40,41);

-- Muse
UPDATE `positions` SET `positions_teamPageGroup` = 3
WHERE `positions_id` IN (29,31,32,33,34,35,54,37,38,39,42,43,44,46);

-- Behind The Scenes
UPDATE `positions` SET `positions_teamPageGroup` = 4
WHERE `positions_id` IN (8,50,9,10,12,13,14,15,16,25,26,55);

-- News
UPDATE `positions` SET `positions_rank` = 7
WHERE `positions_id` = 17;

-- Deputy News
UPDATE `positions` SET `positions_rank` = 8
WHERE `positions_id` = 18;

-- Comment
UPDATE `positions` SET `positions_rank` = 9
WHERE `positions_id` = 19;

-- Deputy Comment
UPDATE `positions` SET `positions_rank` = 10
WHERE `positions_id` = 20;

-- Politics
UPDATE `positions` SET `positions_rank` = 11
WHERE `positions_id` = 23;

-- Deputy Politics
UPDATE `positions` SET `positions_rank` = 12
WHERE `positions_id` = 24;

-- Business
UPDATE `positions` SET `positions_rank` = 13
WHERE `positions_id` = 40;

-- Deputy Business
UPDATE `positions` SET `positions_rank` = 14
WHERE `positions_id` = 41;

-- Science
UPDATE `positions` SET `positions_rank` = 15
WHERE `positions_id` = 27;

-- Deputy Science
UPDATE `positions` SET `positions_rank` = 16
WHERE `positions_id` = 28;

-- Sport
UPDATE `positions` SET `positions_rank` = 17
WHERE `positions_id` = 21;

-- Deputy Sport
UPDATE `positions` SET `positions_rank` = 18
WHERE `positions_id` = 22;

-- Features
UPDATE `positions` SET `positions_rank` = 19
WHERE `positions_id` = 31;

-- Deputy Features
UPDATE `positions` SET `positions_rank` = 20
WHERE `positions_id` = 32;

-- Arts
UPDATE `positions` SET `positions_rank` = 21
WHERE `positions_id` = 33;

-- Deputy Arts
UPDATE `positions` SET `positions_rank` = 22
WHERE `positions_id` = 34;

-- Fashion
UPDATE `positions` SET `positions_rank` = 23
WHERE `positions_id` = 35;

-- Shoot
UPDATE `positions` SET `positions_rank` = 24
WHERE `positions_id` = 37;

-- Music
UPDATE `positions` SET `positions_rank` = 25
WHERE `positions_id` = 38;

-- Deputy Music
UPDATE `positions` SET `positions_rank` = 26
WHERE `positions_id` = 39;

-- Film and TV
UPDATE `positions` SET `positions_rank` = 27
WHERE `positions_id` = 42;

-- Deputy Film and TV
UPDATE `positions` SET `positions_rank` = 28
WHERE `positions_id` = 43;

-- Gaming
UPDATE `positions` SET `positions_rank` = 29
WHERE `positions_id` = 46;

-- Travel
UPDATE `positions` SET `positions_rank` = 30
WHERE `positions_id` = 29;

-- Food and Drink
UPDATE `positions` SET `positions_rank` = 31
WHERE `positions_id` = 44;

-- Creative Writing
UPDATE `positions` SET `positions_rank` = 32
WHERE `positions_id` = 54;

-- Chief Sub-Editor
UPDATE `positions` SET `positions_rank` = 33
WHERE `positions_id` = 13;

-- Sub-Editors
UPDATE `positions` SET `positions_rank` = 34
WHERE `positions_id` = 14;

-- Technical Director
UPDATE `positions` SET `positions_rank` = 35
WHERE `positions_id` = 8;

-- Deputy Technical Director
UPDATE `positions` SET `positions_rank` = 36
WHERE `positions_id` = 50;

-- Design Director
UPDATE `positions` SET `positions_rank` = 37
WHERE `positions_id` = 9;

-- Design Director
UPDATE `positions` SET `positions_rank` = 38
WHERE `positions_id` = 12;

-- Photography Editor
UPDATE `positions` SET `positions_rank` = 39
WHERE `positions_id` = 25;

-- Deputy Photography Editor
UPDATE `positions` SET `positions_rank` = 40
WHERE `positions_id` = 26;

-- Illustration Editor
UPDATE `positions` SET `positions_rank` = 41
WHERE `positions_id` = 15;

-- Distribution Director
UPDATE `positions` SET `positions_rank` = 42
WHERE `positions_id` = 10;

-- Social Secretary
UPDATE `positions` SET `positions_rank` = 43
WHERE `positions_id` = 16;

-- Welfare Officer
UPDATE `positions` SET `positions_rank` = 44
WHERE `positions_id` = 55;

-- Online Editor
UPDATE `positions` SET `positions_rank` = 45
WHERE `positions_id` = 11;

-- Deputy Travel Editor 
UPDATE `positions` SET `positions_rank` = 46
WHERE `positions_id` = 30;

-- Deputy Fashion Editor
UPDATE `positions` SET `positions_rank` = 47
WHERE `positions_id` = 36;

-- Deputy Food and Drink Editor
UPDATE `positions` SET `positions_rank` = 48
WHERE `positions_id` = 45;

-- Deputy Gaming Editor
UPDATE `positions` SET `positions_rank` = 49
WHERE `positions_id` = 47;

-- Video Editor
UPDATE `positions` SET `positions_rank` = 50
WHERE `positions_id` = 49;