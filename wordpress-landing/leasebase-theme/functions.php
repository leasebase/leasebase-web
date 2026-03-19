<?php
/**
 * Leasebase Theme — functions.php
 *
 * Child theme of Twenty Twenty-Five.
 * Adds: SEO meta, Inter font, performance optimizations.
 * Legacy: Early Access CPT + REST endpoint preserved for existing submission data.
 */

defined('ABSPATH') || exit;

/* ============================================================
   AUTH URL CONFIGURATION — TEMPORARY DEV ENVIRONMENT
   ============================================================
   When PROD goes live, update these two URLs and redeploy:
     LEASEBASE_SIGNIN_URL → https://signin.leasebase.ai
     LEASEBASE_SIGNUP_URL → https://signup.leasebase.ai
   Also update the matching URLs in:
     - parts/header.html
     - parts/footer.html
     - templates/front-page.html
     - homepage-content.html
     - README.md (CTA Routing section)
   ============================================================ */
define('LEASEBASE_SIGNIN_URL', 'https://signin.dev.leasebase.ai');
define('LEASEBASE_SIGNUP_URL', 'https://signup.dev.leasebase.ai');

/* ============================================================
   1. ENQUEUE STYLES & SCRIPTS
   ============================================================ */

add_action('wp_enqueue_scripts', 'leasebase_enqueue_assets');
function leasebase_enqueue_assets() {
    // Parent theme
    wp_enqueue_style(
        'twentytwentyfive-style',
        get_template_directory_uri() . '/style.css',
        [],
        wp_get_theme('twentytwentyfive')->get('Version')
    );

    // Child theme
    wp_enqueue_style(
        'leasebase-theme-style',
        get_stylesheet_uri(),
        ['twentytwentyfive-style'],
        wp_get_theme()->get('Version')
    );

    // Google Fonts — Inter (display=swap for performance)
    wp_enqueue_style(
        'leasebase-google-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
        [],
        null
    );

    // Note: Early access form JS removed — CTAs now link directly to signup.
    // Auth URLs configured via LEASEBASE_SIGNIN_URL / LEASEBASE_SIGNUP_URL constants above.
}

/* ============================================================
   2. SEO META TAGS
   ============================================================ */

add_action('wp_head', 'leasebase_seo_meta', 1);
function leasebase_seo_meta() {
    if (is_front_page()) {
        $title = 'LeaseBase — The Operating System for Rental Property Owners';
        $desc  = 'Centralize your properties, leases, tenants, maintenance, and finances in one modern platform. Stop managing rentals through spreadsheets.';
        $url   = home_url('/');
    } elseif (is_page('contact')) {
        $title = 'Contact Us | LeaseBase';
        $desc  = 'Get in touch with the LeaseBase team. Have a question, need support, or want to talk about your property portfolio? We\'re here to help.';
        $url   = home_url('/contact/');
    } elseif (is_page('pricing')) {
        $title = 'LeaseBase Pricing | Simple Pricing for Rental Property Owners';
        $desc  = 'Start free with LeaseBase and upgrade when you\'re ready to automate rent collection, leases, maintenance, and the tenant experience for your rental properties.';
        $url   = home_url('/pricing/');
    } elseif (is_page('demo')) {
        $title = 'LeaseBase Demo | Book a Product Demo';
        $desc  = 'Book a LeaseBase demo to see how owners can manage leases, rent collection, maintenance, and the tenant experience in one connected platform.';
        $url   = home_url('/demo/');
    } else {
        return;
    }
    ?>
    <meta name="description" content="<?php echo esc_attr($desc); ?>">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="<?php echo esc_url($url); ?>">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?php echo esc_attr($title); ?>">
    <meta property="og:description" content="<?php echo esc_attr($desc); ?>">
    <meta property="og:url" content="<?php echo esc_url($url); ?>">
    <meta property="og:site_name" content="LeaseBase">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?php echo esc_attr($title); ?>">
    <meta name="twitter:description" content="<?php echo esc_attr($desc); ?>">
    <?php
}

// Override <title> tag on front page, contact page, and pricing page
add_filter('pre_get_document_title', 'leasebase_document_title');
function leasebase_document_title($title) {
    if (is_front_page()) {
        return 'LeaseBase — The Operating System for Rental Property Owners';
    }
    if (is_page('contact')) {
        return 'Contact Us | LeaseBase';
    }
    if (is_page('pricing')) {
        return 'LeaseBase Pricing | Simple Pricing for Rental Property Owners';
    }
    if (is_page('demo')) {
        return 'LeaseBase Demo | Book a Product Demo';
    }
    return $title;
}

/* ============================================================
   3. CUSTOM POST TYPE: EARLY ACCESS SUBMISSIONS
   ============================================================ */

add_action('init', 'leasebase_register_submissions_cpt');
function leasebase_register_submissions_cpt() {
    register_post_type('lb_submission', [
        'labels' => [
            'name'               => 'Early Access Signups',
            'singular_name'      => 'Signup',
            'menu_name'          => 'Early Access',
            'all_items'          => 'All Signups',
            'view_item'          => 'View Signup',
            'search_items'       => 'Search Signups',
            'not_found'          => 'No signups found',
            'not_found_in_trash' => 'No signups in trash',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-groups',
        'supports'     => ['title', 'custom-fields'],
        'capability_type' => 'post',
    ]);
}

/* ============================================================
   4. REST API ENDPOINT: EARLY ACCESS FORM
   ============================================================ */

add_action('rest_api_init', 'leasebase_register_form_endpoint');
function leasebase_register_form_endpoint() {
    register_rest_route('leasebase/v1', '/early-access', [
        'methods'             => 'POST',
        'callback'            => 'leasebase_handle_early_access',
        'permission_callback' => '__return_true', // Public endpoint
        'args' => [
            'name' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($val) {
                    return !empty(trim($val));
                },
            ],
            'email' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => function ($val) {
                    return is_email($val);
                },
            ],
            'role' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($val) {
                    return in_array($val, ['owner', 'other'], true);
                },
            ],
            'units' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($val) {
                    return !empty(trim($val));
                },
            ],
        ],
    ]);
}

function leasebase_handle_early_access(WP_REST_Request $request) {
    $name  = $request->get_param('name');
    $email = $request->get_param('email');
    $role  = $request->get_param('role');
    $units = $request->get_param('units');

    // Rate limiting: simple check via transient (per IP, 3 submissions per hour)
    $ip_key = 'lb_form_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $count  = (int) get_transient($ip_key);
    if ($count >= 3) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Too many submissions. Please try again later.',
        ], 429);
    }
    set_transient($ip_key, $count + 1, HOUR_IN_SECONDS);

    // Check for duplicate email
    $existing = get_posts([
        'post_type'  => 'lb_submission',
        'meta_key'   => '_lb_email',
        'meta_value' => $email,
        'numberposts' => 1,
    ]);
    if (!empty($existing)) {
        return new WP_REST_Response([
            'success' => true,
            'message' => "You're already on our list! We'll be in touch soon.",
        ], 200);
    }

    // Role label mapping
    $role_labels = [
        'owner'            => 'Property Owner',
        'other'            => 'Other',
    ];
    $role_label = $role_labels[$role] ?? $role;

    // Create submission post
    $post_id = wp_insert_post([
        'post_type'   => 'lb_submission',
        'post_title'  => $name . ' — ' . $email,
        'post_status' => 'publish',
        'meta_input'  => [
            '_lb_name'  => $name,
            '_lb_email' => $email,
            '_lb_role'  => $role,
            '_lb_units' => $units,
            '_lb_date'  => current_time('mysql'),
            '_lb_ip'    => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
        ],
    ]);

    if (is_wp_error($post_id)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Something went wrong. Please try again.',
        ], 500);
    }

    // Send email notification to site admin
    $admin_email = get_option('admin_email');
    $subject     = '[LeaseBase] New Early Access Signup: ' . $name;
    $body        = "New early access signup on LeaseBase:\n\n"
        . "Name:  {$name}\n"
        . "Email: {$email}\n"
        . "Role:  {$role_label}\n"
        . "Units: {$units}\n"
        . "Date:  " . current_time('Y-m-d H:i:s') . "\n\n"
        . "View all signups: " . admin_url('edit.php?post_type=lb_submission');

    wp_mail($admin_email, $subject, $body, ['Content-Type: text/plain; charset=UTF-8']);

    return new WP_REST_Response([
        'success' => true,
        'message' => "Thanks, {$name}! You're on the early access list. We'll be in touch soon.",
    ], 201);
}

/* ============================================================
   5. ADMIN: CUSTOM COLUMNS FOR SUBMISSIONS LIST
   ============================================================ */

add_filter('manage_lb_submission_posts_columns', 'leasebase_submission_columns');
function leasebase_submission_columns($columns) {
    return [
        'cb'        => $columns['cb'],
        'title'     => 'Signup',
        'lb_email'  => 'Email',
        'lb_role'   => 'Role',
        'lb_units'  => 'Units',
        'date'      => 'Date',
    ];
}

add_action('manage_lb_submission_posts_custom_column', 'leasebase_submission_column_data', 10, 2);
function leasebase_submission_column_data($column, $post_id) {
    switch ($column) {
        case 'lb_email':
            echo esc_html(get_post_meta($post_id, '_lb_email', true));
            break;
        case 'lb_role':
            $role_labels = ['owner' => 'Owner', 'other' => 'Other'];
            $role = get_post_meta($post_id, '_lb_role', true);
            echo esc_html($role_labels[$role] ?? $role);
            break;
        case 'lb_units':
            echo esc_html(get_post_meta($post_id, '_lb_units', true));
            break;
    }
}

/* ============================================================
   6. CONTACT FORM: REST ENDPOINT + CPT
   ============================================================ */

add_action('init', 'leasebase_register_contact_cpt');
function leasebase_register_contact_cpt() {
    register_post_type('lb_contact', [
        'labels' => [
            'name'               => 'Contact Messages',
            'singular_name'      => 'Contact Message',
            'menu_name'          => 'Contact Messages',
            'all_items'          => 'All Messages',
            'view_item'          => 'View Message',
            'search_items'       => 'Search Messages',
            'not_found'          => 'No messages found',
            'not_found_in_trash' => 'No messages in trash',
        ],
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'menu_icon'    => 'dashicons-email-alt',
        'supports'     => ['title', 'custom-fields'],
        'capability_type' => 'post',
    ]);
}

add_action('rest_api_init', 'leasebase_register_contact_endpoint');
function leasebase_register_contact_endpoint() {
    register_rest_route('leasebase/v1', '/contact', [
        'methods'             => 'POST',
        'callback'            => 'leasebase_handle_contact',
        'permission_callback' => '__return_true', // Public endpoint
        'args' => [
            'name' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($val) {
                    return !empty(trim($val));
                },
            ],
            'email' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => function ($val) {
                    return is_email($val);
                },
            ],
            'subject' => [
                'required'          => false,
                'type'              => 'string',
                'default'           => 'general',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($val) {
                    return in_array($val, ['general', 'sales', 'support', 'partnership', 'other'], true);
                },
            ],
            'message' => [
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
                'validate_callback' => function ($val) {
                    return !empty(trim($val));
                },
            ],
        ],
    ]);
}

function leasebase_handle_contact(WP_REST_Request $request) {
    $name    = $request->get_param('name');
    $email   = $request->get_param('email');
    $subject = $request->get_param('subject') ?: 'general';
    $message = $request->get_param('message');

    // Rate limiting: 5 submissions per hour per IP
    $ip_key = 'lb_contact_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $count  = (int) get_transient($ip_key);
    if ($count >= 5) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Too many submissions. Please try again later.',
        ], 429);
    }
    set_transient($ip_key, $count + 1, HOUR_IN_SECONDS);

    $subject_labels = [
        'general'     => 'General Inquiry',
        'sales'       => 'Sales & Pricing',
        'support'     => 'Product Support',
        'partnership' => 'Partnership',
        'other'       => 'Other',
    ];
    $subject_label = $subject_labels[$subject] ?? $subject;

    // Store message as a CPT post
    $post_id = wp_insert_post([
        'post_type'   => 'lb_contact',
        'post_title'  => '[' . $subject_label . '] ' . $name . ' — ' . $email,
        'post_status' => 'publish',
        'meta_input'  => [
            '_lb_contact_name'    => $name,
            '_lb_contact_email'   => $email,
            '_lb_contact_subject' => $subject_label,
            '_lb_contact_message' => $message,
            '_lb_contact_date'    => current_time('mysql'),
            '_lb_contact_ip'      => sanitize_text_field($_SERVER['REMOTE_ADDR'] ?? ''),
        ],
    ]);

    if (is_wp_error($post_id)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Something went wrong. Please try again.',
        ], 500);
    }

    // Email notification to site admin
    $admin_email = get_option('admin_email');
    $mail_subject = '[LeaseBase] Contact Form: ' . $subject_label . ' from ' . $name;
    $mail_body    = "New contact form submission on LeaseBase:\n\n"
        . "Name:    {$name}\n"
        . "Email:   {$email}\n"
        . "Subject: {$subject_label}\n"
        . "Date:    " . current_time('Y-m-d H:i:s') . "\n\n"
        . "Message:\n{$message}\n\n"
        . "---\n"
        . "View all messages: " . admin_url('edit.php?post_type=lb_contact');

    wp_mail($admin_email, $mail_subject, $mail_body, ['Content-Type: text/plain; charset=UTF-8']);

    return new WP_REST_Response([
        'success' => true,
        'message' => "Thanks, {$name}! We received your message and will reply within one business day.",
    ], 201);
}

add_filter('manage_lb_contact_posts_columns', 'leasebase_contact_columns');
function leasebase_contact_columns($columns) {
    return [
        'cb'              => $columns['cb'],
        'title'           => 'Summary',
        'lb_contact_email'   => 'Email',
        'lb_contact_subject' => 'Subject',
        'date'            => 'Date',
    ];
}

add_action('manage_lb_contact_posts_custom_column', 'leasebase_contact_column_data', 10, 2);
function leasebase_contact_column_data($column, $post_id) {
    switch ($column) {
        case 'lb_contact_email':
            echo esc_html(get_post_meta($post_id, '_lb_contact_email', true));
            break;
        case 'lb_contact_subject':
            echo esc_html(get_post_meta($post_id, '_lb_contact_subject', true));
            break;
    }
}

/* ============================================================
   7. PERFORMANCE: REMOVE UNNECESSARY DEFAULTS
   ============================================================ */

// Remove WordPress emoji scripts (saves ~10KB)
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

// Remove RSD link
remove_action('wp_head', 'rsd_link');

// Remove wlwmanifest link
remove_action('wp_head', 'wlwmanifest_link');

// Remove shortlink
remove_action('wp_head', 'wp_shortlink_wp_head');

// Remove WordPress version from head
remove_action('wp_head', 'wp_generator');
