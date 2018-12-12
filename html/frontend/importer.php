<?php
require_once __DIR__ . '/common/head.php';
exit;
for ($x = 0; $x <= 14; $x++) {
    $data = json_decode(file_get_contents("data/nouseCOMMENTMETA" . ($x < 10 ? "0" : "") . $x . ".json"), true);

    foreach ($data["posts"] as $post) {
        if ($post["post_type"] != "post") continue;
        if ($post["post_parent"] != "0") {
            var_dump($post);
            continue;
        }
        $postData = [
            "articles_id" => $post["post_id"],
            "articles_authors" => "",
            "articles_published" => ($post["post_date_gmt"] == "0000-00-00 00:00:00" ? $post["post_date"] : $post["post_date_gmt"]),
            "articles_updated" => ($post["post_date_gmt"] == "0000-00-00 00:00:00" ? $post["post_date"] : $post["post_date_gmt"]),
            "articles_showInLists" => ($post['status'] == "publish" ? 1 : 0),
            "articles_showInSearch" => ($post['status'] == "publish" ? 1 : 0),
            "articles_showInAdmin" => 1,
            "articles_type" => 1,
            "articles_slug" => $post["link"],
            "articles_extraMetadata" => json_encode($post["postmeta"]),
            "articles_lifetimeViews" => (isset($post["postmeta"]["views"]) ? $post["postmeta"]["views"] : null)
        ];


        //$DBLIB->where("users_username LIKE '%" . $post['creator'] . "%'");
        $DBLIB->where("users_username",$post['creator']);
        $author = $DBLIB->getone("users", ["users_userid","users_username"]);
        if ($author) {
            $postData["articles_authors"] = $author['users_userid'];
        } else {
            echo $post["post_id"] . ": " . $post['creator'] . "\n";
        }

        if (isset($post['_thumbnail_id'])) $postData["articles_thumbnail"] = $post["postmeta"]["_thumbnail_id"];
        elseif (isset($post['postmeta']["_articlephoto_url"]) and strlen($post['postmeta']["_articlephoto_url"]) > 0) {
            $postData["articles_thumbnail"] = $post["postmeta"]["_articlephoto_url"];
        }
        $postCategories = [];
        foreach ($post['categories'] as $category) {
            $DBLIB->where("categories_name", $category);
            $category = $DBLIB->getone("categories", ["categories_id"]);
            if ($category) array_push($postCategories, $category["categories_id"]);
        }
        $postData["articles_categories"] = implode(",", $postCategories);

        $postID = $DBLIB->insert("articles", $postData);
        if (!$postID) {
            var_dump($post);
            echo $DBLIB->getLastError() . "\n";
        }

        $postDraftData = [
            "articles_id" => $postID,
            "articlesDrafts_timestamp" => ($post["post_date_gmt"] == "0000-00-00 00:00:00" ? $post["post_date"] : $post["post_date_gmt"]),
            "articlesDrafts_headline" => ($post["title"] != null ? $post['title'] : $post["link"]),
            "articlesDrafts_byline" => $post["excerpt"],
            "articlesDrafts_text" => $post["content"],
        ];
        if (isset($post['postmeta']["_articlephoto_caption"]) and $post['postmeta']["_articlephoto_caption"] != null) {
            $postDraftData["articlesDrafts_byline"] .= " (Thumbnail credit " . $post['postmeta']["_articlephoto_caption"] . ")";
        }
        if (!$DBLIB->insert("articlesDrafts", $postDraftData)) {
            var_dump($post);
            echo $DBLIB->getLastError() . "\n";
        }

        foreach ($post['comments'] as $comment) {
            $commentData = [
                "comments_id" => $comment['id'],
                "comments_authorName" => $comment["author"],
                "comments_authorEmail" => $comment['author_email'],
                "comments_authorURL" => $comment["author_url"],
                "comments_authorIP" => $comment["author_ip"],
                "comments_created" => ($comment["date_gmt"] == "0000-00-00 00:00:00" ? $comment["date"] : $comment["date_gmt"]),
                "comments_text" => $comment["content"],
                "comments_show" => ($comment["approved"] == 1 ? 1 : 0),
                "users_userid" => $comment["user_id"],
                "articles_id" => $postID,
                "comments_metadata" => json_encode($comment['metadata']),
                "comments_nestUnder" => ($comment['parent'] > 0 ? $comment['parent'] : null),
            ];
            if (isset($comment['metadata']["nouse_votes_up"])) $commentData['comments_upvotes'] = $comment['metadata']["nouse_votes_up"];
            if (isset($comment['metadata']["nouse_votes_down"])) $commentData['comments_upvotes'] = $comment['metadata']["nouse_votes_down"];
            if (!$DBLIB->insert("comments", $commentData)) {
                echo $DBLIB->getLastError() . "\n";
                var_dump($comment);
            }
        }
    }
}

?>


