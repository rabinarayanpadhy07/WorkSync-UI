import { BadgeCheckIcon, CameraIcon, CrownIcon, CreditCardIcon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { updateProfileRequest } from '@/apis/auth';
import { getPreginedUrl, uploadImageToAWSpresignedUrl } from '@/apis/s3';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/context/useAuth';
import { useUserSettingsModal } from '@/hooks/context/useUserSettingsModal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { getAvatarUrl } from '@/utils/getAvatarUrl';

export const UserSettingsModal = () => {
    const navigate = useNavigate();
    const { auth, setAuth } = useAuth();
    const { openUserSettingsModal, setOpenUserSettingsModal } = useUserSettingsModal();
    const fileInputRef = useRef(null);
    const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);

    const currentPlan = auth?.user?.plan === 'Paid' ? 'Paid' : 'Normal';
    const isPaidPlan = currentPlan === 'Paid';
    const usernameInitial = auth?.user?.username?.[0]?.toUpperCase() || 'U';

    function handleClose() {
        setOpenUserSettingsModal(false);
    }

    function handleUpgrade() {
        setOpenUserSettingsModal(false);
        navigate('/makepayment');
    }

    async function handleProfilePictureChange(event) {
        const file = event.target.files?.[0];
        if (!file || !auth?.token) return;

        setIsUploadingProfilePicture(true);
        try {
            const preSignedUrl = await getPreginedUrl({ token: auth.token });
            if (!preSignedUrl) {
                throw new Error('Could not create an upload URL.');
            }

            await uploadImageToAWSpresignedUrl({
                url: preSignedUrl,
                file
            });

            const profilePicture = preSignedUrl.split('?')[0];
            const response = await updateProfileRequest({
                token: auth.token,
                profilePicture
            });
            const nextUser = {
                ...auth.user,
                ...response.data
            };

            setAuth({
                token: auth.token,
                user: nextUser,
                isLoading: false
            });
            toast.success('Profile picture updated');
        } catch (error) {
            toast.error('Could not update profile picture', {
                description: getApiErrorMessage(error, 'Please try again.')
            });
        } finally {
            setIsUploadingProfilePicture(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    return (
        <Dialog open={openUserSettingsModal} onOpenChange={setOpenUserSettingsModal}>
            <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-2xl">
                <div className="bg-[radial-gradient(circle_at_top,_#0f172a,_#111827_45%,_#1e293b_100%)] px-6 py-6 text-white">
                    <DialogHeader>
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80">
                            <SparklesIcon className="size-3.5" />
                            Account settings
                        </div>
                        <DialogTitle className="mt-4 text-2xl">Manage your profile and plan</DialogTitle>
                        <DialogDescription className="text-white/65">
                            View your account details and manage your subscription from inside the workspace.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="space-y-6 px-6 py-6">
                    <section className="flex items-center gap-4 rounded-3xl bg-slate-50 p-4">
                        <Avatar className="size-16 ring-4 ring-white">
                            <AvatarImage src={getAvatarUrl(auth?.user)} />
                            <AvatarFallback>{usernameInitial}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-slate-900">{auth?.user?.username}</p>
                            <p className="truncate text-sm text-slate-500">{auth?.user?.email}</p>
                        </div>
                        <div className="ml-auto">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePictureChange}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-full"
                                disabled={isUploadingProfilePicture}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploadingProfilePicture ? (
                                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                                ) : (
                                    <CameraIcon className="mr-2 size-4" />
                                )}
                                Change photo
                            </Button>
                        </div>
                    </section>

                    <section className={`rounded-[28px] border p-5 ${isPaidPlan ? 'border-emerald-200 bg-emerald-50/70' : 'border-sky-200 bg-sky-50/70'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isPaidPlan ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                    {isPaidPlan ? <BadgeCheckIcon className="size-3.5" /> : <CrownIcon className="size-3.5" />}
                                    {isPaidPlan ? 'Paid plan active' : 'Normal plan active'}
                                </div>
                                <h3 className="mt-3 text-xl font-semibold text-slate-900">{currentPlan} plan</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {isPaidPlan
                                        ? 'Your account already has unlimited workspace and channel access.'
                                        : 'You are currently on the normal plan with 1 workspace and up to 2 channels per workspace.'}
                                </p>
                            </div>
                            <div className={`rounded-2xl p-3 ${isPaidPlan ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                                <CreditCardIcon className="size-5" />
                            </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                            {isPaidPlan ? (
                                <Button type="button" className="rounded-full" onClick={handleClose}>
                                    Done
                                </Button>
                            ) : (
                                <>
                                    <Button type="button" className="rounded-full" onClick={handleUpgrade}>
                                        Upgrade to Paid
                                    </Button>
                                    <Button type="button" variant="outline" className="rounded-full" onClick={handleClose}>
                                        Maybe later
                                    </Button>
                                </>
                            )}
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
};
