<?php

declare(strict_types=1);

// Redirect domain root to the user front-end app.
header('Location: /front-end/out/', true, 302);
exit;
