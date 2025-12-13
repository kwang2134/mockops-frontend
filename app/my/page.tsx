'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { updateNickname } from '@/lib/api/users';

export default function MyPage() {
  const router = useRouter();
  const { user, isLoggedIn, loading, refreshUser } = useAuth();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [updating, setUpdating] = useState(false);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center text-gray-600">로딩 중...</div>
          </div>
        </div>
      </>
    );
  }

  if (!isLoggedIn || !user) {
    router.push('/login');
    return null;
  }

  const handleEditNickname = () => {
    setNewNickname(user.nickname);
    setIsEditingNickname(true);
  };

  const handleCancelEdit = () => {
    setIsEditingNickname(false);
    setNewNickname('');
  };

  const handleUpdateNickname = async () => {
    if (!newNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (newNickname === user.nickname) {
      setIsEditingNickname(false);
      return;
    }

    try {
      setUpdating(true);
      await updateNickname(newNickname);
      alert('닉네임이 수정되었습니다.');
      await refreshUser();
      setIsEditingNickname(false);
    } catch (error) {
      console.error('Failed to update nickname:', error);
      alert('닉네임 수정에 실패했습니다.');
    } finally {
      setUpdating(false);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '관리자';
      case 'USER':
        return '일반 사용자';
      default:
        return role;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
            <p className="mt-2 text-gray-600">내 정보를 확인하고 수정할 수 있습니다.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* 프로필 헤더 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold border-4 border-white/30">
                {user.nickname.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">{user.nickname}</h2>
              <p className="mt-1 text-blue-100">{user.email}</p>
            </div>

            {/* 정보 섹션 */}
            <div className="p-8 space-y-6">
              {/* 이메일 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                  {user.email}
                </div>
                <p className="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
              </div>

              {/* 닉네임 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">닉네임</label>
                <div className="flex items-center gap-3">
                  {isEditingNickname ? (
                    <>
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="새 닉네임 입력"
                        autoFocus
                      />
                      <button
                        onClick={handleUpdateNickname}
                        disabled={updating}
                        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:bg-gray-400"
                      >
                        {updating ? '수정 중...' : '확인'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={updating}
                        className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:bg-gray-100"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {user.nickname}
                      </div>
                      <button
                        onClick={handleEditNickname}
                        className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
                      >
                        수정
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 권한 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">권한</label>
                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {getRoleName(user.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 뒤로 가기 버튼 */}
          <div className="mt-8">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              ← 뒤로 가기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}