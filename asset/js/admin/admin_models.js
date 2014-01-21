/**
 * @fileoverview Model used in admin interface.
 */

cr.define('cr.model', function() {
  'use strict';

  var File = new cr.BaseModel('file'),
      User = new cr.BaseModel('user'),
      Log = new cr.BaseModel('log'),
      Disk = new cr.BaseModel('disk'),
      RegularFilmShow = new cr.BaseModel('regularfilmshow'),
      PreviewShowTicket = new cr.BaseModel('previewshowticket'),
      DiskReview = new cr.BaseModel('diskreview'),
      News = new cr.BaseModel('news'),
      Document = new cr.BaseModel('document'),
      Publication = new cr.BaseModel('publication'),
      Sponsor = new cr.BaseModel('sponsor'),
      Exco = new cr.BaseModel('exco'),
      SiteSettings = new cr.BaseModel('sitesettings'),
      OneSentence = new cr.BaseModel('onesentence');

  File.fields = [
    'id',
    'name',
    'url',
  ];

  User.fields = [
    'id',
    'expire_at',
    'expired',
    'admin',
    'full_name',
    'itsc',
    'join_at',
    'member_type',
    'mobile',
    'pennalized',
    'rfs_count',
    'login_count',
    'student_id',
    'university_id',
  ];

  User.types = ['create', 'edit', 'delete'];

  Log.fields = [
    'id',
    'model',
    'log_type',
    'model_refer',
    'user_affected',
    'admin_involved',
    'content',
    'created_at',
  ];

  Disk.fields = [
    'id',
    'director_en',
    'director_ch',
    'category',
    'create_log',
    'imdb_url',
    'show_year',
    'avail_type',
    'actors',
    'desc_en',
    'tags',
    'reserved_by',
    'title_en',
    'cover_url',
    'hold_by',
    'disk_type',
    'due_at',
    'borrow_cnt',
    'length',
    'desc_ch',
    'title_ch',
  ];

  Disk.types = ['create', 'edit', 'delete', 'reserve', 'borrow', 'rate'];

  RegularFilmShow.fields = [
    'id',
    'state',
    'film_1',
    'film_2',
    'film_3',
    'vote_cnt_1',
    'vote_cnt_2',
    'vote_cnt_3',
    'create_log',
    'remarks',
    'participant_list',
  ];

  RegularFilmShow.types = ['create', 'edit', 'delete', 'vote', 'entry'];

  PreviewShowTicket.fields = [
    'id',
    'state',
    'title_en',
    'title_ch',
    'desc_en',
    'desc_ch',
    'director_en',
    'director_ch',
    'actors',
    'cover_url',
    'language',
    'subtitle',
    'venue',
    'show_time',
    'apply_deadline',
    'length',
    'quantity',
    'remarks',
    'successful_applicant',
    'create_log',
  ];

  PreviewShowTicket.types = ['create', 'edit', 'delete', 'apply'];

  DiskReview.fields = [
    'id',
    'poster',
    'disk',
    'content',
    'create_log',
  ];

  DiskReview.types = ['create', 'delete'];

  News.fields = [
    'id',
    'title',
    'content',
    'create_log',
  ];

  News.types = ['create', 'edit', 'delete'];

  Document.fields = [
    'id',
    'title',
    'doc_url',
    'create_log',
  ];

  Document.types = ['create', 'edit', 'delete'];

  Publication.fields = [
    'id',
    'pub_type',
    'title',
    'cover_url',
    'doc_url',
    'ext_doc_url',
    'create_log',
  ];

  Publication.types = ['create', 'edit', 'delete'];

  Sponsor.fields = [
    'id',
    'name',
    'img_url',
    'create_log',
  ];

  Sponsor.types = ['create', 'edit', 'delete'];

  Exco.fields = [
    'id',
    'name_en',
    'name_ch',
    'descript',
    'position',
    'email',
    'hall_allocate',
    'img_url',
  ];

  SiteSettings.fields = [
    'id',
    'key',
    'value',
  ];
  SiteSettings._cache_dict = {};

  SiteSettings.loadSettings = function(callback) {
    var r = new cr.APIRequest(this, 'GET', '/', true);
    r.onload = function(e) {
      for (var i = 0; i < e.recObj.objects.length; i++) {
        SiteSettings.update(e.recObj.objects[i], 1);
        SiteSettings._cache_dict[e.recObj.objects[i].key] = e.recObj.objects[i].id;
      }
      if (callback) {
        callback();
      }
    };
    r.onerror = cr.errorHandler;
    r.send();
  };
  SiteSettings.getField = function(field) {
    if (!this._cache_dict[field]) {
      return null;
    }
    return this._cache[this._cache_dict[field]].data;
  };

  OneSentence.fields = [
    'id',
    'content',
    'create_log',
    'film',
  ];

  OneSentence.types = ['create', 'edit', 'delete'];

  return {
    File: File,
    User: User,
    Log: Log,
    Disk: Disk,
    RegularFilmShow: RegularFilmShow,
    PreviewShowTicket: PreviewShowTicket,
    DiskReview: DiskReview,
    News: News,
    Document: Document,
    Publication: Publication,
    Sponsor: Sponsor,
    Exco: Exco,
    SiteSettings: SiteSettings,
    OneSentence: OneSentence,
  }
});

cr.model.User.setup(true);
cr.model.Disk.setup(true);
cr.model.RegularFilmShow.setup(true);
cr.model.PreviewShowTicket.setup(true);
cr.model.News.setup(true);
cr.model.Document.setup(true);
cr.model.Publication.setup(true);
cr.model.Sponsor.setup(true);
cr.model.Exco.setup(true);
