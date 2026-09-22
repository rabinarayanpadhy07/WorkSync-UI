import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner";

import { capturePaymentRequest } from "@/apis/payments"
import { useAuth } from "@/hooks/context/useAuth";

export const useCaptureOrder = () => {
    const { auth, setAuth } = useAuth();
    const {
        mutateAsync: captureOrderMutation,
        error,
        isSuccess,
        isPending
    } = useMutation({
        mutationFn: ({ orderId, status, paymentId, signature }) => capturePaymentRequest({
            token: auth?.token,
            orderId,
            status,
            paymentId,
            signature
        }),
        onSuccess: (updatedUser, variables) => {
            if (updatedUser) {
                const nextUser = {
                    ...auth?.user,
                    ...updatedUser
                };

                setAuth({
                    token: auth?.token,
                    user: nextUser,
                    isLoading: false
                });
            }

            console.log('Payment captured successfully');
            if (variables?.status === 'success') {
                toast.success('Plan upgraded successfully', {
                    description: 'Your account now has paid access.'
                });
            }
        },
        onError: (error) => {
            console.log('Error in capturing payment', error);
            toast.error('Payment verification failed', {
                description: error?.err || error?.message || 'Please try again.'
            });
        }
    });

    return {
        captureOrderMutation,
        error,
        isSuccess,
        isPending
    }
};
