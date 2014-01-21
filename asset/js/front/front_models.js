/**
 * @fileoverview Model used in front end.
 */

cr.define('cr.model', function() {
  'use strict';

  var File = new cr.BaseModel('file'),
      User = new cr.BaseModel('user'),
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
    'admin',
    'full_name',
    'itsc',
    'member_type',
    'pennalized',
    'rfs_count',
    'login_count',
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
    'title_en',
    'cover_url',
    'disk_type',
    'due_at',
    'borrow_cnt',
    'length',
    'desc_ch',
    'title_ch',
    'user_held',
  ];

  Disk.CN = function(disk) {
    return disk.disk_type + pad(disk.id, 4);
  }

  RegularFilmShow.fields = [
    'id',
    'state',
    'film_1',
    'film_2',
    'film_3',
    'vote_cnt_1',
    'vote_cnt_2',
    'vote_cnt_3',
    'remarks',
    'create_log',
  ];

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

  DiskReview.fields = [
    'id',
    'disk',
    'content',
    'create_log',
  ];

  News.fields = [
    'id',
    'title',
    'content',
    'create_log',
  ];

  Document.fields = [
    'id',
    'title',
    'doc_url',
    'create_log',
  ];

  Publication.fields = [
    'id',
    'pub_type',
    'title',
    'cover_url',
    'doc_url',
    'ext_doc_url',
    'create_log',
  ];

  Sponsor.fields = [
    'id',
    'name',
    'img_url',
  ];

  Exco.fields = [
    'id',
    'name_en',
    'name_ch',
    'descript',
    'position',
    'email',
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
    'film',
  ];

  return {
    File: File,
    User: User,
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

cr.model.Disk.setup(true);
cr.model.RegularFilmShow.setup(true);
cr.model.PreviewShowTicket.setup(true);
cr.model.News.setup(true);
cr.model.Document.setup(true);
cr.model.Publication.setup(true);
cr.model.Sponsor.setup(true);
cr.model.Exco.setup(true);
