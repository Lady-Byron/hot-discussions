import Widget from 'flarum/extensions/afrux-forum-widgets-core/common/components/Widget';
import app from 'flarum/forum/app';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Link from 'flarum/common/components/Link';
import icon from 'flarum/common/helpers/icon';

export default class HotDiscussionsWidget extends Widget {
  oninit(vnode) {
    super.oninit(vnode);
    this.loading = true;
  }

  oncreate(vnode) {
    super.oncreate(vnode);
    
    const limitHotDisc = app.forum.attribute('justoverclock-hot-discussions.discLimit') || 10;
    const hideClosed = app.forum.attribute('justoverclock-hot-discussions.hideClosed') === '1';
    const filterParams = hideClosed ? { q: '-is:locked' } : {};

    // 核心逻辑保留：多获取数据以防过滤损耗
    const fetchLimit = limitHotDisc * 3;

    app.store
      .find('discussions', {
        sort: '-commentCount',
        filter: filterParams,
        page: { limit: fetchLimit },
        // include 'state' 修复阅读进度跳转
        // include 'tags' 用于过滤隐藏标签
        include: 'tags,state', 
      })
      .then((results) => {
        // 过滤隐藏标签
        const visibleDiscussions = results.filter((disc) => {
          const tags = disc.tags();
          if (!tags) return true;
          return !tags.some((tag) => tag.subscription() === 'hide');
        });

        this.hotDisc = visibleDiscussions.slice(0, limitHotDisc);
        this.loading = false;
        m.redraw();
      });
  }

  className() {
    return 'hotDiscussions-widget';
  }

  icon() {
    // 保持原有图标，但去掉了强制红色的类
    return 'fab fa-hotjar'; 
  }

  title() {
    return app.translator.trans('justoverclock-hot-discussions.forum.widget-title');
  }

  content() {
    if (this.loading) {
      return <LoadingIndicator />;
    }
    
    return (
      <div className="hotDiscussion-content">
        <ul className="hotDisc-list">
          {this.hotDisc.map((disc) => {
            return (
              <li className="hotDisc-item">
                <Link href={app.route.discussion(disc)} className="hotDisc-link">
                  
                  {/* 左侧：简单的序号或图标装饰，这里用一个小圆点装饰 */}
                  <span className="hotDisc-bullet"></span>

                  {/* 中间：标题 */}
                  <span className="hotDisc-title">{disc.title()}</span>

                  {/* 右侧：极简的评论数统计 */}
                  <span className="hotDisc-stats">
                    {icon('fas fa-comment-alt')} {disc.commentCount()}
                  </span>
                  
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
}
