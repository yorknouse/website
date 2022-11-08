(function ($) {
    "use strict";
    var osru = {
        initialize: function () {
            this.tabHover();
            this.navHover();
            this.fullSkinSearch();
            this.toTop();
            this.accordion();
            this.parallax();
            this.stickySidebar();
        },

// -------------------------------------------------------------------------- //
// Tab Hover
// -------------------------------------------------------------------------- //
        tabHover: function () {
            $(document).off('click.bs.tab.data-api', '[data-hover="tab"]');
            $(document).on('mouseenter.bs.tab.data-api', '[data-toggle="tab"], [data-hover="tab"]', function () {
                $(this).tab('show');
            });
        },
// -------------------------------------------------------------------------- //
// Nav Hover
// -------------------------------------------------------------------------- //      
        navHover: function () {
            var b = "navFadeInUp";
            var c;
            var a;
            d($(".menu-tabs a"), $(".menu-tab-content"));
            function d(e, f, g) {
                e.hover(function (i) {
                    i.preventDefault();
                    $(this).tab("show");
                    var h = $(this).data("easein");
                    if (c) {
                        c.removeClass(a);
                    }
                    if (h) {
                        f.find("div.active").addClass("animated " + h);
                        a = h;
                    } else {
                        if (g) {
                            f.find("div.active").addClass("animated " + g);
                            a = g;
                        } else {
                            f.find("div.active").addClass("animated " + b);
                            a = b;
                        }
                    }
                    c = f.find("div.active");
                });
            }
            $("a[rel=popover]")
                    .popover()
                    .on('click', function (f) {
                        f.preventDefault();
                        if ($(this).data("easein") !== undefined) {
                            $(this)
                                    .next()
                                    .removeClass($(this).data("easein"))
                                    .addClass("animated " + $(this).data("easein"));
                        } else {
                            $(this)
                                    .next()
                                    .addClass("animated " + b);
                        }
                    });
        },
// -------------------------------------------------------------------------- //
// Full Skin Search
// -------------------------------------------------------------------------- //
        fullSkinSearch: function () {
            var openCtrl1 = document.getElementById('btn-search1'),
                    openCtrl2 = document.getElementById('btn-search2'),
                    closeCtrl = document.getElementById('btn-search-close'),
                    searchContainer = document.querySelector('.search'),
                    inputSearch = searchContainer.querySelector('.search__input');

            function init() {
                initEvents();
            }

            function initEvents() {
                try {
                    openCtrl1.addEventListener('click', openSearch);
                    openCtrl2.addEventListener('click', openSearch);
                    closeCtrl.addEventListener('click', closeSearch);
                    document.addEventListener('keyup', function (ev) {
                        // escape key.
                        if (ev.keyCode === 27) {
                            closeSearch();
                        }
                    });
                }
                catch(err) {
                    return true;
                }

            }

            function openSearch() {
                searchContainer.classList.add('search--open');
                inputSearch.focus();
            }

            function closeSearch() {
                searchContainer.classList.remove('search--open');
                inputSearch.blur();
                inputSearch.value = '';
            }

            init();
        },

// -------------------------------------------------------------------------- //
// Back to top
// -------------------------------------------------------------------------- //  
        toTop: function () {
            $('body').append('<div id="toTop" class="btn btn-top"><i class="fa fa-arrow-up"></i></div>');
            $(window).scroll(function () {
                if ($(this).scrollTop() !== 0) {
                    $('#toTop').fadeIn();
                } else {
                    $('#toTop').fadeOut();
                }
            });
            $('#toTop').on('click', function () {
                $("html, body").animate({scrollTop: 0}, 600);
                return false;
            });
        },


// -------------------------------------------------------------------------- //
// Accordion
// -------------------------------------------------------------------------- //   
        accordion: function () {
            $('.accordion > li:eq(0) a').addClass('active').next().slideDown();
            $('.accordion a').on('click', function (j) {
                var dropDown = $(this).closest('li').find('p');

                $(this).closest('.accordion').find('p').not(dropDown).slideUp();

                if ($(this).hasClass('active')) {
                    $(this).removeClass('active');
                } else {
                    $(this).closest('.accordion').find('a.active').removeClass('active');
                    $(this).addClass('active');
                }

                dropDown.stop(false, true).slideToggle();

                j.preventDefault();
            });
        },
// -------------------------------------------------------------------------- //
// Parallax Header
// -------------------------------------------------------------------------- //
        parallax: function () {
            $('.parallax').parallaxBackground();
        },
// -------------------------------------------------------------------------- //
// Sticky Sidebar
// -------------------------------------------------------------------------- //
        stickySidebar: function () {
            $('.leftSidebar, .content, .rightSidebar').theiaStickySidebar({
                additionalMarginTop: 30
            });
        },
    };

    // Initialize
    $(document).ready(function () {
        osru.initialize();
    });
}(jQuery));