import Link from 'next/link'
import { createClient } from '../../../lib/supabase-server'
import Sidebar from '../../components/Sidebar'
import RoleBadge from '../../components/RoleBadge'
import { notFound } from 'next/navigation'

// 카테고리 이름 → 색상 클래스 매핑
const CAT_COLOR: Record<string, string> = {
  '국어': 'cat-korean',
  '논술': 'cat-korean',
  '수학': 'cat-math',
  '과학': 'cat-science',
  '사회': 'cat-social',
  '영어': 'cat-english',
  '예체능': 'cat-art',
  '컴퓨터': 'cat-computer',
  '코딩': 'cat-computer',
}
function catClass(name?: string) {
  if (!name) return 'cat-etc'
  for (const key in CAT_COLOR) {
    if (name.includes(key)) return CAT_COLOR[key]
  }
  return 'cat-etc'
}

// 한 페이지에 보여줄 글 수
const PAGE_SIZE = 15

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ category?: string; page?: string }>
}) {
  const { slug } = await params
  const { category: categoryParam, page: pageParam } = await searchParams
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from('board_groups')
    .select('id, name, sort_order, boards(id, slug, name, sort_order)')
    .order('sort_order')
    .order('sort_order', { referencedTable: 'boards' })

  const { data: board } = await supabase
    .from('boards')
    .select('id, slug, name, description, layout_type, uses_category, allows_files')
    .eq('slug', slug)
    .single()

  if (!board) {
    notFound()
  }

  const { data: categories } = board.uses_category
    ? await supabase
        .from('categories')
        .select('id, name')
        .eq('board_id', board.id)
        .order('sort_order')
    : { data: [] as { id: number; name: string }[] }

  const selectedCategoryId = categoryParam ? Number(categoryParam) : null

  // 현재 페이지 (1 이상 정수로 보정)
  const currentPage = Math.max(1, Number(pageParam) || 1)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // count: true 로 전체 개수도 함께 조회
  let postsQuery = supabase
    .from('posts')
    .select(
      'id, title, view_count, like_count, comment_count, download_count, created_at, category_id, profiles(nickname, role), categories(name), post_attachments(id)',
      { count: 'exact' }
    )
    .eq('board_id', board.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (selectedCategoryId) {
    postsQuery = postsQuery.eq('category_id', selectedCategoryId)
  }

  const { data: posts, count } = await postsQuery

  const isResource = board.layout_type === 'resource'
  const totalCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // 카테고리 필터가 있으면 페이지 링크에 함께 붙일 쿼리
  const categoryQuery = selectedCategoryId ? `category=${selectedCategoryId}&` : ''

  // 페이지 번호 목록 (현재 페이지 기준 앞뒤 2개씩, 최대 5개 노출)
  const pageWindow = 2
  const startPage = Math.max(1, currentPage - pageWindow)
  const endPage = Math.min(totalPages, currentPage + pageWindow)
  const pageNumbers: number[] = []
  for (let p = startPage; p <= endPage; p++) {
    pageNumbers.push(p)
  }

  return (
    <div className="layout">
      <Sidebar groups={groups ?? []} />
      <main className="main">

        <div className="board-head">
          <div className="board-titlebox">
            <div className="board-title">{board.name}</div>
            {board.description && (
              <div className="board-desc">{board.description}</div>
            )}
          </div>
          <Link href={`/boards/${slug}/write`} className="board-write">＋ 글쓰기</Link>
        </div>

        {board.uses_category && categories && categories.length > 0 && (
          <div className="filterbar">
            <Link
              href={`/boards/${slug}`}
              className={!selectedCategoryId ? 'chip active' : 'chip'}
            >
              전체
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/boards/${slug}?category=${c.id}`}
                className={selectedCategoryId === c.id ? 'chip active' : 'chip'}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {posts && posts.length > 0 ? (
          <>
            <div className="list">
              <div className={board.uses_category ? 'list-header' : 'list-header no-cat'}>
                <span className="col-num">번호</span>
                {board.uses_category && <span className="col-cat">분류</span>}
                <span className="col-title">제목</span>
                <span className="col-author">작성자</span>
                <span className="col-date">날짜</span>
                <span className="col-dl">{isResource ? '↓받음' : '조회'}</span>
                <span className="col-like">♥</span>
              </div>

              {posts.map((post, index) => {
                const d = new Date(post.created_at)
                const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
                const author = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
                const category = Array.isArray(post.categories) ? post.categories[0] : post.categories
                const hasAttachment = Array.isArray(post.post_attachments) && post.post_attachments.length > 0
                // 전체 개수 기준 번호: 1페이지 첫 글이 totalCount, 다음 페이지로 갈수록 이어짐
                const rowNum = totalCount - from - index

                return (
                  <div className={board.uses_category ? 'list-row' : 'list-row no-cat'} key={post.id}>
                    <div className="col-num">{rowNum}</div>
                    {board.uses_category && (
                      <div className="col-cat">
                        {category && (
                          <span className={`cat-tag ${catClass(category.name)}`}>{category.name}</span>
                        )}
                      </div>
                    )}
                    <div className="col-title">
                      <Link
                        href={`/boards/${slug}/${post.id}`}
                        className="row-title"
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {hasAttachment && <span className="file-ico">📎</span>}
                        {post.title}
                        {post.comment_count > 0 && (
                          <span className="reply-cnt">[{post.comment_count}]</span>
                        )}
                      </Link>
                    </div>
                    <div className={`col-author ${(author as { role?: string })?.role === 'admin' ? 'is-admin' : (author as { role?: string })?.role === 'official' ? 'is-official' : ''}`}>
                      <RoleBadge role={(author as { role?: string })?.role} />
                      {author?.nickname ?? '익명'}
                    </div>
                    <div className="col-date">{dateStr}</div>
                    <div className="col-dl">
                      {isResource
                        ? (post.download_count > 0 ? <b>{post.download_count}</b> : '–')
                        : post.view_count}
                    </div>
                    <div className="col-like">{post.like_count > 0 ? <b>{post.like_count}</b> : '–'}</div>
                    <div className="row-subline">
                      <span>{author?.nickname ?? '익명'}</span>
                      <span>·</span>
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span>조회 {post.view_count}</span>
                      {post.like_count > 0 && <><span>·</span><span>♥ {post.like_count}</span></>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 페이지네이션 */}
            <div className="pagination">
                {currentPage > 1 && (
                  <Link
                    href={`/boards/${slug}?${categoryQuery}page=${currentPage - 1}`}
                    className="page-btn page-arrow"
                  >
                    ‹
                  </Link>
                )}

                {startPage > 1 && (
                  <>
                    <Link href={`/boards/${slug}?${categoryQuery}page=1`} className="page-btn">1</Link>
                    {startPage > 2 && <span className="page-ellipsis">…</span>}
                  </>
                )}

                {pageNumbers.map((p) => (
                  <Link
                    key={p}
                    href={`/boards/${slug}?${categoryQuery}page=${p}`}
                    className={p === currentPage ? 'page-btn active' : 'page-btn'}
                  >
                    {p}
                  </Link>
                ))}

                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="page-ellipsis">…</span>}
                    <Link href={`/boards/${slug}?${categoryQuery}page=${totalPages}`} className="page-btn">
                      {totalPages}
                    </Link>
                  </>
                )}

                {currentPage < totalPages && (
                  <Link
                    href={`/boards/${slug}?${categoryQuery}page=${currentPage + 1}`}
                    className="page-btn page-arrow"
                  >
                    ›
                  </Link>
                )}
              </div>
          </>
        ) : (
          <p className="list-empty">아직 게시글이 없습니다. 첫 글을 작성해보세요.</p>
        )}

      </main>
    </div>
  )
}
