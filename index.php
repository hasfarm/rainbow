<?php

declare(strict_types=1);

// Redirect domain root to the frontend app entry page.
header('Location: /front-end/', true, 302);
exit;
